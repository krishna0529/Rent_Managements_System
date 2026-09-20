package com.Rent_Management.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RazorpayOrderResponse {
    private String orderId;
    private Long amountInPaise;
    private Double amount;
    private String currency;
    private String keyId;
    private String businessName;
    private String tenantName;
    private String tenantEmail;
    private String tenantContact;
    private String roomUnit;
    private String billingMonth;
}
