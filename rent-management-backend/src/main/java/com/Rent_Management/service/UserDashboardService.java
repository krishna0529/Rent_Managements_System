package com.Rent_Management.service;

import com.Rent_Management.dto.*;

public interface UserDashboardService {

    UserDashboardResponse getDashboardData(String token);

    UserDashboardResponse.PaymentHistoryItem payDues(String token, UserPaymentRequest request, String ipAddress);

    void validateActiveUser(String token);

    RazorpayOrderResponse createRazorpayOrder(String token, Double amount);

    UserDashboardResponse.PaymentHistoryItem verifyAndProcessRazorpayPayment(String token, RazorpayPaymentVerifyRequest request, String ipAddress);

    void handleRazorpayPaymentFailure(String token, RazorpayPaymentFailureRequest request, String ipAddress);
}
