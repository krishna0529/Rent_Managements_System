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

    @PostMapping("/payment/razorpay/create-order")
    public ResponseEntity<ApiResponse<com.Rent_Management.dto.RazorpayOrderResponse>> createRazorpayOrder(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody(required = false) com.Rent_Management.dto.RazorpayOrderCreateRequest orderRequest,
            HttpServletRequest request
    ) {
        if (token == null || token.isBlank()) {
            token = request.getHeader("Authorization");
        }
        Double amount = (orderRequest != null) ? orderRequest.getAmount() : null;
        com.Rent_Management.dto.RazorpayOrderResponse order = userDashboardService.createRazorpayOrder(token, amount);
        return ResponseEntity.ok(ApiResponse.success("Razorpay payment order initialized successfully", order));
    }

    @PostMapping("/payment/razorpay/verify")
    public ResponseEntity<ApiResponse<UserDashboardResponse.PaymentHistoryItem>> verifyRazorpayPayment(
            @RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody com.Rent_Management.dto.RazorpayPaymentVerifyRequest verifyRequest,
            HttpServletRequest request
    ) {
        if (token == null || token.isBlank()) {
            token = request.getHeader("Authorization");
        }
        String ipAddress = request.getRemoteAddr();
        UserDashboardResponse.PaymentHistoryItem payment = userDashboardService.verifyAndProcessRazorpayPayment(token, verifyRequest, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Razorpay payment verified & receipt dispatched successfully", payment));
    }

    @PostMapping("/payment/razorpay/failure")
    public ResponseEntity<ApiResponse<Void>> reportRazorpayFailure(
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody com.Rent_Management.dto.RazorpayPaymentFailureRequest failureRequest,
            HttpServletRequest request
    ) {
        if (token == null || token.isBlank()) {
            token = request.getHeader("Authorization");
        }
        String ipAddress = request.getRemoteAddr();
        userDashboardService.handleRazorpayPaymentFailure(token, failureRequest, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Payment failure logged and email alert dispatched to resident", null));
    }
}
