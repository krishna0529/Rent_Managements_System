package com.Rent_Management.scheduler;

import com.Rent_Management.entity.Payment;
import com.Rent_Management.entity.Role;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import com.Rent_Management.entity.UserStatus;
import com.Rent_Management.repository.PaymentRepository;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.repository.UserRepository;
import com.Rent_Management.service.AuditLogService;
import com.Rent_Management.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class RentDueNotificationScheduler {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    /**
     * Daily cron running at 09:00 AM server time.
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void scheduledRentDueCheck() {
        log.info("[RENT DUE CRON] Starting scheduled daily rent due reminder scan...");
        Map<String, Object> report = checkAndDispatchRentDueReminders();
        log.info("[RENT DUE CRON] Daily rent due reminder scan completed: {}", report);
    }

    /**
     * Checks all approved active tenants whose nextDueDate has arrived (30 days from joining / next cycle),
     * and dispatches email notifications. Can also be invoked manually via REST endpoint.
     */
    @Transactional
    public Map<String, Object> checkAndDispatchRentDueReminders() {
        LocalDate today = LocalDate.now();
        List<User> users = userRepository.findAll();
        int scanned = 0;
        int emailsSent = 0;
        int skippedAlreadySentToday = 0;
        int notDueYet = 0;

        for (User user : users) {
            // Only active tenant users
            if (!user.isActive() || user.getRole() == Role.ROLE_ADMIN) {
                continue;
            }
            if (user.getStatus() != null && user.getStatus() != UserStatus.APPROVED) {
                continue;
            }

            scanned++;

            // Ensure nextDueDate is populated in database from date_of_joining + 30 days
            if (user.getNextDueDate() == null) {
                if (user.getDateOfJoining() != null) {
                    user.setNextDueDate(user.getDateOfJoining().plusDays(30));
                } else {
                    user.setNextDueDate(today.plusDays(30));
                }
                user = userRepository.save(user);
            }

            Optional<Room> roomOpt = roomRepository.findByAssignedUser(user);
            if (roomOpt.isEmpty()) {
                // Tenant doesn't have an allocated room unit yet
                continue;
            }

            Room room = roomOpt.get();
            LocalDate dueDate = user.getNextDueDate();

            // Check if 30 days have arrived (due today or overdue)
            if (today.isEqual(dueDate) || today.isAfter(dueDate)) {
                // Prevent duplicate email dispatch on the same calendar day
                if (user.getLastDueReminderSent() != null && user.getLastDueReminderSent().isEqual(today)) {
                    skippedAlreadySentToday++;
                    continue;
                }

                // Verify if rent is already settled
                List<Payment> payments = paymentRepository.findByUserOrderByCreatedAtDesc(user);
                boolean hasPendingDues = payments.stream()
                        .anyMatch(p -> !"PAID".equalsIgnoreCase(p.getPaymentStatus()) && !"Security Deposit".equalsIgnoreCase(p.getBillingMonth()));

                // If user has pending dues OR no regular rent payment exists for the cycle
                Double rentAmount = room.getRentAmount() != null ? room.getRentAmount() : 0.0;

                try {
                    emailService.sendRentDueReminderNotification(
                            user.getEmail(),
                            user.getFullName(),
                            room.getRoomId(),
                            rentAmount,
                            dueDate
                    );

                    user.setLastDueReminderSent(today);
                    userRepository.save(user);
                    emailsSent++;

                    auditLogService.log(
                            "RENT_DUE_REMINDER_SENT",
                            "SYSTEM_SCHEDULER",
                            "User",
                            user.getId().toString(),
                            "Dispatched 30-day rent payment due reminder to " + user.getFullName() + " (" + user.getEmail() + ") for Unit " + room.getRoomId() + " (Due: " + dueDate + ", Rent: ₹" + rentAmount + ")",
                            "127.0.0.1"
                    );
                } catch (Exception e) {
                    log.error("[RENT DUE DISPATCH ERROR] Failed to send reminder to user {}: {}", user.getEmail(), e.getMessage());
                }
            } else {
                notDueYet++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("scannedTenants", scanned);
        result.put("emailsSent", emailsSent);
        result.put("skippedAlreadySentToday", skippedAlreadySentToday);
        result.put("notDueYet", notDueYet);
        result.put("timestamp", today.toString());
        return result;
    }
}
