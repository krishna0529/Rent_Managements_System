package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.dto.UserDashboardResponse;
import com.Rent_Management.dto.UserPaymentRequest;
import com.Rent_Management.service.UserDashboardService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class UserDashboardController {

    private final UserDashboardService userDashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<UserDashboardResponse>> getDashboard(
            @RequestHeader(value = "Authorization", required = false) String token,
            HttpServletRequest request
    ) {
        if (token == null || token.isBlank()) {
            token = request.getHeader("Authorization");
        }
        UserDashboardResponse data = userDashboardService.getDashboardData(token);
        return ResponseEntity.ok(ApiResponse.success("Tenant dashboard data fetched successfully from database", data));
    }

    @GetMapping("/session-check")
    public ResponseEntity<ApiResponse<Boolean>> checkSession(
            @RequestHeader(value = "Authorization", required = false) String token,
            HttpServletRequest request
    ) {
        if (token == null || token.isBlank()) {
            token = request.getHeader("Authorization");
        }
        userDashboardService.validateActiveUser(token);
        return ResponseEntity.ok(ApiResponse.success("User session is active and valid", true));
    }

    @PostMapping("/pay")
    public ResponseEntity<ApiResponse<UserDashboardResponse.PaymentHistoryItem>> payDues(
            @RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody UserPaymentRequest paymentRequest,
            HttpServletRequest request
    ) {
        if (token == null || token.isBlank()) {
            token = request.getHeader("Authorization");
        }
        String ipAddress = request.getRemoteAddr();
        UserDashboardResponse.PaymentHistoryItem payment = userDashboardService.payDues(token, paymentRequest, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Payment recorded successfully in database", payment));
    }
}
