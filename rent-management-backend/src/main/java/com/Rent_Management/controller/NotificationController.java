package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.repository.UserRepository;
import com.Rent_Management.scheduler.RentDueNotificationScheduler;
import com.Rent_Management.service.AuditLogService;
import com.Rent_Management.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class NotificationController {

    private final RentDueNotificationScheduler scheduler;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    /**
     * Diagnostic status endpoint for rent notification pipeline.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("active", true);
        status.put("currentDate", LocalDate.now().toString());
        status.put("cronExpression", "0 0 9 * * ? (Daily at 09:00 AM)");
        status.put("description", "Automated 30-day rent payment due reminders dispatched via Gmail SMTP.");
        return ResponseEntity.ok(ApiResponse.success("Notification pipeline operational", status));
    }

    /**
     * Triggers the automated 30-day rent due notification scan immediately.
     */
    @PostMapping("/trigger-due-reminders")
    public ResponseEntity<ApiResponse<Map<String, Object>>> triggerDueReminders() {
        log.info("[API TRIGGER] Manual invocation of 30-day rent due reminder dispatch pipeline.");
        Map<String, Object> result = scheduler.checkAndDispatchRentDueReminders();
        return ResponseEntity.ok(ApiResponse.success("Rent due notification check completed successfully.", result));
    }

    /**
     * Send instant rent due reminder email to a specific user (for test or manual reminder).
     */
    @PostMapping("/send-tenant-reminder/{userId}")
    public ResponseEntity<ApiResponse<String>> sendReminderToTenant(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant not found with ID: " + userId));

        Optional<Room> roomOpt = roomRepository.findByAssignedUser(user);
        String roomUnit = roomOpt.map(Room::getRoomId).orElse("Assigned Suite");
        Double rentAmount = roomOpt.map(Room::getRentAmount).orElse(0.0);

        LocalDate dueDate = user.getNextDueDate() != null
                ? user.getNextDueDate()
                : (user.getDateOfJoining() != null ? user.getDateOfJoining().plusDays(30) : LocalDate.now().plusDays(30));

        try {
            emailService.sendRentDueReminderNotification(
                    user.getEmail(),
                    user.getFullName(),
                    roomUnit,
                    rentAmount,
                    dueDate
            );

            user.setLastDueReminderSent(LocalDate.now());
            userRepository.save(user);

            auditLogService.log(
                    "RENT_DUE_REMINDER_DISPATCHED",
                    "ADMIN",
                    "User",
                    user.getId().toString(),
                    "Manually triggered 30-day rent reminder to " + user.getFullName() + " for Unit " + roomUnit + " (Due: " + dueDate + ")",
                    "127.0.0.1"
            );

            return ResponseEntity.ok(ApiResponse.success(
                    "Rent due reminder email dispatched successfully to " + user.getEmail(),
                    String.format("Due Date: %s | Rent: \u20B9%,.2f", dueDate, rentAmount)
            ));
        } catch (Exception e) {
            log.error("[RENT DUE REMINDER ERROR] Failed dispatch to user {}: {}", user.getEmail(), e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to deliver rent reminder email: " + e.getMessage()));
        }
    }
}
