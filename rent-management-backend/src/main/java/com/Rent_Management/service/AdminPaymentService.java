package com.Rent_Management.service;

import com.Rent_Management.dto.PaymentRecordRequest;
import com.Rent_Management.dto.PaymentResponse;

import java.util.List;

public interface AdminPaymentService {

    List<PaymentResponse> getAllPayments(String status);

    List<PaymentResponse> getPendingPayments();

    PaymentResponse getPaymentById(Long id);

    PaymentResponse markPaymentAsPaid(Long id, PaymentRecordRequest request, String performedBy);

    PaymentResponse updatePaymentStatus(Long id, com.Rent_Management.dto.PaymentStatusUpdateRequest request, String performedBy);

    void deletePayment(Long id, String performedBy);
}
