package com.Rent_Management.service;

import com.Rent_Management.dto.UserDashboardResponse;
import com.Rent_Management.dto.UserPaymentRequest;

public interface UserDashboardService {

    UserDashboardResponse getDashboardData(String token);

    UserDashboardResponse.PaymentHistoryItem payDues(String token, UserPaymentRequest request, String ipAddress);

    void validateActiveUser(String token);
}
