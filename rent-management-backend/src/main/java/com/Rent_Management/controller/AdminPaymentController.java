package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.dto.PaymentRecordRequest;
import com.Rent_Management.dto.PaymentResponse;
import com.Rent_Management.service.AdminPaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AdminPaymentController {

    private final AdminPaymentService adminPaymentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments(
            @RequestParam(value = "status", required = false) String status
    ) {
        List<PaymentResponse> payments = adminPaymentService.getAllPayments(status);
        return ResponseEntity.ok(ApiResponse.success("Payment ledger retrieved successfully", payments));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPendingPayments() {
        List<PaymentResponse> pending = adminPaymentService.getPendingPayments();
        return ResponseEntity.ok(ApiResponse.success("Pending payment dues retrieved", pending));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable Long id) {
        PaymentResponse payment = adminPaymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.success("Payment transaction details retrieved", payment));
    }

    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<ApiResponse<PaymentResponse>> markPaymentAsPaid(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid PaymentRecordRequest request
    ) {
        PaymentResponse paid = adminPaymentService.markPaymentAsPaid(id, request, "Harpreet Singh (Admin)");
        return ResponseEntity.ok(ApiResponse.success("Payment marked as settled and cleared in database", paid));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> updatePaymentStatus(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid com.Rent_Management.dto.PaymentStatusUpdateRequest request
    ) {
        PaymentResponse updated = adminPaymentService.updatePaymentStatus(id, request, "Harpreet Singh (Admin)");
        return ResponseEntity.ok(ApiResponse.success("Payment status updated to " + request.getStatus() + " successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePayment(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        adminPaymentService.deletePayment(id, "Harpreet Singh (Admin)");
        return ResponseEntity.ok(ApiResponse.success("Payment ledger record removed", null));
    }
}
