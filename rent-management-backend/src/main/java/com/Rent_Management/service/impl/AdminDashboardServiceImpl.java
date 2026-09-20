package com.Rent_Management.service.impl;

import com.Rent_Management.dto.DashboardAnalyticsResponse;
import com.Rent_Management.dto.PaymentResponse;
import com.Rent_Management.entity.ElectricityBill;
import com.Rent_Management.entity.Payment;
import com.Rent_Management.entity.User;
import com.Rent_Management.entity.UserStatus;
import com.Rent_Management.repository.ElectricityBillRepository;
import com.Rent_Management.repository.PaymentRepository;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.repository.UserRepository;
import com.Rent_Management.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final ElectricityBillRepository electricityBillRepository;
    private final PaymentRepository paymentRepository;

    private void syncMissingSecurityDepositPayments() {
        try {
            List<com.Rent_Management.entity.Room> rooms = roomRepository.findAll();
            for (com.Rent_Management.entity.Room r : rooms) {
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
                                    .paymentDate(u.getApprovedAt() != null ? u.getApprovedAt() : java.time.LocalDateTime.now())
                                    .build();
                            paymentRepository.save(depositPayment);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    @Transactional
    public DashboardAnalyticsResponse getDashboardAnalytics() {
        return getDashboardAnalytics("Live DB Telemetry");
    }

    @Override
    @Transactional
    public DashboardAnalyticsResponse getDashboardAnalytics(String period) {
        syncMissingSecurityDepositPayments();
        String activePeriod = (period != null && !period.isBlank()) ? period.trim() : "Live DB Telemetry";

        // 3.1.4 - User Counts (100% from users table)
        List<User> allUsers = userRepository.findAll();
        long userTotal = allUsers.size();
        long userActive = allUsers.stream().filter(User::isActive).count();
        long userInactive = userTotal - userActive;

        long pendingApprovals = userRepository.countByStatus(UserStatus.PENDING);

        // Room inventory metrics (100% from rooms table)
        long totalRooms = roomRepository.count();
        long occupiedRooms = roomRepository.countByStatus("OCCUPIED");
        long vacantRooms = roomRepository.countByStatus("VACANT");

        LocalDate today = LocalDate.now();
        String currentMonthName = today.format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH));
        String currentMonthShort = today.format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH));
        int currentYear = today.getYear();

        List<Payment> allPayments = paymentRepository.findAll();
        List<ElectricityBill> allBills = electricityBillRepository.findAll();

        Double expectedRent = roomRepository.calculateMonthlyExpectedRent();

        Double rentMonthlyTotal;
        Double lightBillMonthlyTotal;
        Double totalPendingDues;
        Double totalCollectedRevenue;
        List<Payment> periodPayments;
        List<ElectricityBill> periodBills;

        if ("Current Cycle".equalsIgnoreCase(activePeriod)) {
            // Filter payments & bills for current cycle/month
            periodPayments = allPayments.stream()
                    .filter(p -> (p.getBillingMonth() != null && (p.getBillingMonth().equalsIgnoreCase(currentMonthName) || p.getBillingMonth().equalsIgnoreCase(currentMonthShort) || p.getBillingMonth().toLowerCase().contains("current")))
                            || (p.getCreatedAt() != null && p.getCreatedAt().getMonth() == today.getMonth() && p.getCreatedAt().getYear() == currentYear))
                    .collect(Collectors.toList());

            periodBills = allBills.stream()
                    .filter(b -> (b.getBillingMonth() != null && (b.getBillingMonth().equalsIgnoreCase(currentMonthName) || b.getBillingMonth().equalsIgnoreCase(currentMonthShort)))
                            || (b.getCreatedAt() != null && b.getCreatedAt().getMonth() == today.getMonth() && b.getCreatedAt().getYear() == currentYear))
                    .collect(Collectors.toList());

            Double recRent = periodPayments.stream()
                    .filter(p -> !"Security Deposit".equalsIgnoreCase(p.getBillingMonth()))
                    .mapToDouble(p -> p.getRentAmount() != null ? p.getRentAmount() : 0.0)
                    .sum();
            rentMonthlyTotal = recRent > 0 ? recRent : (expectedRent != null ? expectedRent : 0.0);

            lightBillMonthlyTotal = periodBills.stream()
                    .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
                    .sum();

            totalCollectedRevenue = periodPayments.stream()
                    .mapToDouble(p -> p.getAmountPaid() != null ? p.getAmountPaid() : 0.0)
                    .sum();

            totalPendingDues = periodPayments.stream()
                    .mapToDouble(p -> p.getPendingAmount() != null ? p.getPendingAmount() : 0.0)
                    .sum();

        } else if ("Year-To-Date".equalsIgnoreCase(activePeriod)) {
            // Filter payments & bills for current calendar year
            periodPayments = allPayments.stream()
                    .filter(p -> (p.getCreatedAt() != null && p.getCreatedAt().getYear() == currentYear)
                            || (p.getBillingMonth() != null && p.getBillingMonth().contains(String.valueOf(currentYear))))
                    .collect(Collectors.toList());

            periodBills = allBills.stream()
                    .filter(b -> (b.getCreatedAt() != null && b.getCreatedAt().getYear() == currentYear)
                            || (b.getBillingMonth() != null && b.getBillingMonth().contains(String.valueOf(currentYear))))
                    .collect(Collectors.toList());

            Double recRent = periodPayments.stream()
                    .filter(p -> !"Security Deposit".equalsIgnoreCase(p.getBillingMonth()))
                    .mapToDouble(p -> p.getRentAmount() != null ? p.getRentAmount() : 0.0)
                    .sum();
            rentMonthlyTotal = recRent > 0 ? recRent : (expectedRent != null ? expectedRent : 0.0);

            lightBillMonthlyTotal = periodBills.stream()
                    .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
                    .sum();

            totalCollectedRevenue = periodPayments.stream()
                    .mapToDouble(p -> p.getAmountPaid() != null ? p.getAmountPaid() : 0.0)
                    .sum();

            totalPendingDues = periodPayments.stream()
                    .mapToDouble(p -> p.getPendingAmount() != null ? p.getPendingAmount() : 0.0)
                    .sum();

        } else {
            // Live DB Telemetry - Full real-time metrics
            periodPayments = allPayments;
            periodBills = allBills;

            Double recordedMonthRent = paymentRepository.calculateMonthlyTotalRent(currentMonthName);
            if (recordedMonthRent != null && recordedMonthRent > 0) {
                rentMonthlyTotal = recordedMonthRent;
            } else if (expectedRent != null && expectedRent > 0) {
                rentMonthlyTotal = expectedRent;
            } else {
                Double allRent = paymentRepository.calculateAllTimeTotalRent();
                rentMonthlyTotal = allRent != null ? allRent : 0.0;
            }

            Double lightBillMonth = electricityBillRepository.calculateMonthlyTotalLightBill(currentMonthName);
            Double lightBillAllTime = electricityBillRepository.calculateAllTimeTotalLightBill();
            lightBillMonthlyTotal = (lightBillMonth != null && lightBillMonth > 0)
                    ? lightBillMonth
                    : (lightBillAllTime != null ? lightBillAllTime : 0.0);

            Double pending = paymentRepository.calculateTotalPendingDues();
            Double collected = paymentRepository.calculateTotalRealizedRevenue();
            totalPendingDues = pending != null ? pending : 0.0;
            totalCollectedRevenue = collected != null ? collected : 0.0;
        }

        // Monthly telemetry points for charts
        Set<String> distinctMonths = new LinkedHashSet<>();
        for (Payment p : allPayments) {
            if (p.getBillingMonth() != null && !p.getBillingMonth().isBlank()) {
                distinctMonths.add(p.getBillingMonth());
            } else if (p.getCreatedAt() != null) {
                distinctMonths.add(p.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH)));
            }
        }
        for (ElectricityBill b : allBills) {
            if (b.getBillingMonth() != null && !b.getBillingMonth().isBlank()) {
                distinctMonths.add(b.getBillingMonth());
            } else if (b.getCreatedAt() != null) {
                distinctMonths.add(b.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH)));
            }
        }

        // If no months logged yet in database, show current and previous calendar months dynamically with 0.0
        if (distinctMonths.isEmpty()) {
            for (int i = 2; i >= 0; i--) {
                distinctMonths.add(LocalDate.now().minusMonths(i).format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH)));
            }
        }

        List<DashboardAnalyticsResponse.MonthlyAnalysisPoint> monthlyPoints = new ArrayList<>();
        for (String m : distinctMonths) {
            double rentSum = allPayments.stream()
                    .filter(p -> m.equalsIgnoreCase(p.getBillingMonth())
                            || (p.getCreatedAt() != null && m.equalsIgnoreCase(p.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH)))))
                    .mapToDouble(p -> p.getRentAmount() != null ? p.getRentAmount() : 0.0)
                    .sum();

            if (rentSum == 0 && (m.equalsIgnoreCase(currentMonthName) || m.toLowerCase().contains("current"))) {
                rentSum = expectedRent != null ? expectedRent : 0.0;
            }

            double powerSum = allBills.stream()
                    .filter(b -> m.equalsIgnoreCase(b.getBillingMonth())
                            || (b.getCreatedAt() != null && m.equalsIgnoreCase(b.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH)))))
                    .mapToDouble(b -> b.getUnitsConsumed() != null ? b.getUnitsConsumed() : 0.0)
                    .sum();

            double lightBillSum = allBills.stream()
                    .filter(b -> m.equalsIgnoreCase(b.getBillingMonth())
                            || (b.getCreatedAt() != null && m.equalsIgnoreCase(b.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH)))))
                    .mapToDouble(b -> b.getTotalAmount() != null ? b.getTotalAmount() : 0.0)
                    .sum();

            monthlyPoints.add(DashboardAnalyticsResponse.MonthlyAnalysisPoint.builder()
                    .month(m)
                    .rentInflow(rentSum)
                    .powerUnitsKwh(powerSum)
                    .lightBillAmount(lightBillSum)
                    .build());
        }

        // Live Payment History: Fetch recent completed/settled tenant payments
        List<Payment> recentCompleted = paymentRepository.findCompletedPayments();
        List<PaymentResponse> recentPaymentResponses = recentCompleted.stream()
                .limit(10)
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());

        return DashboardAnalyticsResponse.builder()
                .rentMonthlyTotal(rentMonthlyTotal)
                .lightBillMonthlyTotal(lightBillMonthlyTotal)
                .userActiveCount(userActive)
                .userInactiveCount(userInactive)
                .userTotalCount(userTotal)
                .totalRooms(totalRooms)
                .occupiedRooms(occupiedRooms)
                .vacantRooms(vacantRooms)
                .pendingApprovalsCount(pendingApprovals)
                .totalPendingDues(totalPendingDues != null ? totalPendingDues : 0.0)
                .totalCollectedRevenue(totalCollectedRevenue != null ? totalCollectedRevenue : 0.0)
                .monthlyAnalysis(monthlyPoints)
                .recentPayments(recentPaymentResponses)
                .build();
    }

    private PaymentResponse mapToPaymentResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .userName(p.getUser() != null ? p.getUser().getFullName() : "N/A")
                .userMobile(p.getUser() != null ? p.getUser().getMobileNumber() : "N/A")
                .roomId(p.getRoom() != null ? p.getRoom().getId() : null)
                .roomCode(p.getRoom() != null ? p.getRoom().getRoomId() : "N/A")
                .billingMonth(p.getBillingMonth())
                .rentAmount(p.getRentAmount())
                .electricityAmount(p.getElectricityAmount())
                .totalAmount(p.getTotalAmount())
                .amountPaid(p.getAmountPaid())
                .pendingAmount(p.getPendingAmount())
                .paymentStatus(p.getPaymentStatus())
                .paymentMode(p.getPaymentMode())
                .transactionReference(p.getTransactionReference())
                .paymentDate(p.getPaymentDate())
                .createdAt(p.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPaymentsCsv(String period) {
        syncMissingSecurityDepositPayments();
        List<Payment> allPayments = paymentRepository.findAll();

        String activePeriod = (period == null || period.trim().isEmpty()) ? "Live DB Telemetry" : period.trim();
        LocalDate now = LocalDate.now();
        String currentMonthName = now.format(DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH));
        int currentYear = now.getYear();

        List<Payment> filteredPayments;
        if ("Current Cycle".equalsIgnoreCase(activePeriod)) {
            filteredPayments = allPayments.stream()
                    .filter(p -> (p.getBillingMonth() != null && (p.getBillingMonth().equalsIgnoreCase(currentMonthName) || p.getBillingMonth().toLowerCase().contains("current")))
                            || (p.getCreatedAt() != null && p.getCreatedAt().getMonth() == now.getMonth() && p.getCreatedAt().getYear() == now.getYear()))
                    .collect(Collectors.toList());
            if (filteredPayments.isEmpty()) {
                filteredPayments = allPayments;
            }
        } else if ("Year-To-Date".equalsIgnoreCase(activePeriod)) {
            filteredPayments = allPayments.stream()
                    .filter(p -> (p.getCreatedAt() != null && p.getCreatedAt().getYear() == currentYear)
                            || (p.getBillingMonth() != null && p.getBillingMonth().contains(String.valueOf(currentYear))))
                    .collect(Collectors.toList());
            if (filteredPayments.isEmpty()) {
                filteredPayments = allPayments;
            }
        } else {
            filteredPayments = allPayments;
        }

        // Sort by creation date descending
        filteredPayments.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM for Microsoft Excel compatibility
        sb.append('\uFEFF');

        // CSV Header
        sb.append("Transaction ID,Tenant Name,Mobile Number,Room Code,Billing Month,Rent Amount (INR),Electricity Amount (INR),Total Amount (INR),Amount Paid (INR),Pending Amount (INR),Payment Status,Payment Mode,Transaction Reference,Payment Date,Created Date\n");

        for (Payment p : filteredPayments) {
            String id = p.getId() != null ? String.valueOf(p.getId()) : "";
            String userName = (p.getUser() != null && p.getUser().getFullName() != null) ? p.getUser().getFullName() : "N/A";
            String userMobile = (p.getUser() != null && p.getUser().getMobileNumber() != null) ? p.getUser().getMobileNumber() : "N/A";
            String roomCode = (p.getRoom() != null && p.getRoom().getRoomId() != null) ? p.getRoom().getRoomId() : "N/A";
            String month = p.getBillingMonth() != null ? p.getBillingMonth() : "";
            String rent = String.format(Locale.US, "%.2f", p.getRentAmount() != null ? p.getRentAmount() : 0.0);
            String elec = String.format(Locale.US, "%.2f", p.getElectricityAmount() != null ? p.getElectricityAmount() : 0.0);
            String total = String.format(Locale.US, "%.2f", p.getTotalAmount() != null ? p.getTotalAmount() : 0.0);
            String paid = String.format(Locale.US, "%.2f", p.getAmountPaid() != null ? p.getAmountPaid() : 0.0);
            String pending = String.format(Locale.US, "%.2f", p.getPendingAmount() != null ? p.getPendingAmount() : 0.0);
            String status = p.getPaymentStatus() != null ? p.getPaymentStatus() : "PENDING";
            String mode = p.getPaymentMode() != null ? p.getPaymentMode() : "N/A";
            String ref = p.getTransactionReference() != null ? p.getTransactionReference() : "N/A";
            String payDate = p.getPaymentDate() != null ? p.getPaymentDate().toString() : "N/A";
            String created = p.getCreatedAt() != null ? p.getCreatedAt().toString() : "N/A";

            sb.append(escapeCsv(id)).append(",")
              .append(escapeCsv(userName)).append(",")
              .append(escapeCsv(userMobile)).append(",")
              .append(escapeCsv(roomCode)).append(",")
              .append(escapeCsv(month)).append(",")
              .append(rent).append(",")
              .append(elec).append(",")
              .append(total).append(",")
              .append(paid).append(",")
              .append(pending).append(",")
              .append(escapeCsv(status)).append(",")
              .append(escapeCsv(mode)).append(",")
              .append(escapeCsv(ref)).append(",")
              .append(escapeCsv(payDate)).append(",")
              .append(escapeCsv(created)).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value == null) return "\"\"";
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
