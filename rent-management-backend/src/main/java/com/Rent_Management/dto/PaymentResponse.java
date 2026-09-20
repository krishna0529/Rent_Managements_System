package com.Rent_Management.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userMobile;
    private Long roomId;
    private String roomCode;
    private String billingMonth;
    private Double rentAmount;
    private Double electricityAmount;
    private Double totalAmount; // rent + electricity
    private Double amountPaid;
    private Double pendingAmount;
    private String paymentStatus; // PENDING, PAID, PARTIAL
    private String paymentMode; // UPI, CASH, BANK_TRANSFER
    private String transactionReference;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
}
