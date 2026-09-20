package com.Rent_Management.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDashboardResponse {

    private UserProfileResponse user;
    private RoomInfo room;
    private BillInfo latestBill;
    private DuesInfo currentDues;
    private List<PaymentHistoryItem> paymentHistory;
    private String wifiNetwork;
    private String wifiPassword;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoomInfo {
        private Long id;
        private String roomId;
        private String propertyType;
        private Double rentAmount;
        private String meterNumber;
        private Double baselineUnit;
        private String floorNumber;
        private String status;
        private Double securityDeposit;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BillInfo {
        private Long id;
        private String billingMonth;
        private Double previousUnit;
        private Double currentUnit;
        private Double unitsConsumed;
        private Double ratePerUnit;
        private Double totalAmount;
        private String status;
        private LocalDate billDate;
        private LocalDate dueDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DuesInfo {
        private Long paymentId;
        private String billingMonth;
        private Double rentAmount;
        private Double electricityAmount;
        private Double totalAmount;
        private Double amountPaid;
        private Double pendingAmount;
        private String status; // PENDING, PAID, NO_DUES
        private LocalDate dueDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentHistoryItem {
        private Long id;
        private String invoiceNumber;
        private String billingMonth;
        private Double rentAmount;
        private Double electricityAmount;
        private Double totalAmount;
        private Double amountPaid;
        private String status;
        private String paymentMode;
        private String transactionReference;
        private LocalDateTime paymentDate;
        private LocalDateTime createdAt;
    }
}
