package com.Rent_Management.config;

import com.Rent_Management.entity.Admin;
import com.Rent_Management.entity.AuditLog;
import com.Rent_Management.entity.Payment;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import com.Rent_Management.repository.AdminRepository;
import com.Rent_Management.repository.AuditLogRepository;
import com.Rent_Management.repository.PaymentRepository;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminDataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE admin ADD COLUMN IF NOT EXISTS profile_image_path VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS next_due_date DATE;");
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_due_reminder_sent DATE;");
            // Backfill next_due_date as date_of_joining + 30 days
            jdbcTemplate.execute("UPDATE users SET next_due_date = date_of_joining + 30 WHERE next_due_date IS NULL AND date_of_joining IS NOT NULL;");
        } catch (Exception e) {
            log.warn("[ADMIN DATA INITIALIZER] Schema update note: {}", e.getMessage());
        }

        // Default primary administrator seeding removed per user requirement.
        // Administrators are now managed dynamically via the Admin Directory.

        // 2. Initial Audit Log entry if empty
        if (auditLogRepository.count() == 0) {
            AuditLog a1 = AuditLog.builder()
                    .action("SYSTEM_INITIALIZATION")
                    .performedBy("Harpreet Singh (Admin)")
                    .targetEntity("System")
                    .targetId("INIT")
                    .details("Database-backed enterprise rent management system initialized cleanly.")
                    .ipAddress("127.0.0.1")
                    .build();
            auditLogRepository.save(a1);
        }

        // 3. Reconcile missing Cash Security Deposit payments for active approved tenants
        try {
            List<Room> rooms = roomRepository.findAll();
            for (Room r : rooms) {
                User u = r.getAssignedUser();
                if (u != null && u.isActive()) {
                    Double deposit = r.getDepositAmount() != null && r.getDepositAmount() > 0
                            ? r.getDepositAmount()
                            : (r.getRentAmount() != null ? r.getRentAmount() * 2.0 : 0.0);

                    if (deposit > 0) {
                        List<Payment> existing = paymentRepository.findByUserAndBillingMonth(u, "Security Deposit");
                        if (existing.isEmpty()) {
                            Payment depositPayment = Payment.builder()
                                    .user(u)
                                    .room(r)
                                    .electricityBill(null)
                                    .billingMonth("Security Deposit")
                                    .rentAmount(deposit)
                                    .electricityAmount(0.0)
                                    .totalAmount(deposit)
                                    .amountPaid(deposit)
                                    .pendingAmount(0.0)
                                    .paymentStatus("PAID")
                                    .paymentMode("CASH")
                                    .transactionReference("CASH-DEP-" + u.getId() + "-" + System.currentTimeMillis())
                                    .paymentDate(u.getApprovedAt() != null ? u.getApprovedAt() : LocalDateTime.now())
                                    .build();
                            paymentRepository.save(depositPayment);
                            log.info("[ADMIN DATA INITIALIZER] Backfilled CASH Security Deposit ₹{} for tenant '{}' ({}) in Unit '{}'",
                                    deposit, u.getFullName(), u.getEmail(), r.getRoomId());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[ADMIN DATA INITIALIZER] Deposit sync note: {}", e.getMessage());
        }
    }
}
