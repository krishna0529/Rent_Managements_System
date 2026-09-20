package com.Rent_Management.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRecordRequest {

    @NotNull(message = "Amount paid is required")
    @Positive(message = "Amount paid must be greater than zero")
    private Double amountPaid;

    private String paymentMode; // UPI, CASH, BANK_TRANSFER

    private String transactionReference;
}
