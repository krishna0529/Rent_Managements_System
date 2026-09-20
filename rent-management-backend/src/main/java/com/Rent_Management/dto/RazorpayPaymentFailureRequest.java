package com.Rent_Management.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayPaymentFailureRequest {
    private String orderId;
    private String paymentId;
    private String errorCode;
    private String errorDescription;
    private Double amount;
}
