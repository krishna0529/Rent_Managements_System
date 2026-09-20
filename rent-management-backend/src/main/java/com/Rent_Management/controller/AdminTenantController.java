package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.dto.TenantApprovalResponse;
import com.Rent_Management.dto.TenantRejectRequest;
import com.Rent_Management.service.AdminTenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tenants")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AdminTenantController {

    private final AdminTenantService adminTenantService;

    /**
     * 1. Get all pending tenant registrations awaiting admin verification
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<TenantApprovalResponse>>> getPendingTenants() {
        List<TenantApprovalResponse> pendingList = adminTenantService.getPendingTenants();
        return ResponseEntity.ok(ApiResponse.success("Pending tenant approval queue retrieved successfully", pendingList));
    }

    /**
     * 2. Get live pending count badge
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> getPendingCount() {
        long count = adminTenantService.getPendingCount();
        return ResponseEntity.ok(ApiResponse.success("Pending count fetched successfully", count));
    }

    /**
     * 3. Get all tenants (optional filter: PENDING, APPROVED, REJECTED, ALL)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TenantApprovalResponse>>> getAllTenants(
            @RequestParam(value = "status", required = false) String status
    ) {
        List<TenantApprovalResponse> list = adminTenantService.getAllTenants(status);
        return ResponseEntity.ok(ApiResponse.success("Tenant registry retrieved successfully", list));
    }

    /**
     * 4. Get detailed single tenant dossier
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TenantApprovalResponse>> getTenantById(@PathVariable Long id) {
        TenantApprovalResponse response = adminTenantService.getTenantById(id);
        return ResponseEntity.ok(ApiResponse.success("Tenant dossier retrieved successfully", response));
    }

    /**
     * 5. Authorize and approve tenant filing
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<TenantApprovalResponse>> approveTenant(
            @PathVariable Long id,
            @RequestParam(value = "roomId", required = false) Long roomId,
            @RequestParam(value = "depositAmount", required = false) Double depositAmount
    ) {
        TenantApprovalResponse approved = adminTenantService.approveTenant(id, roomId, depositAmount);
        return ResponseEntity.ok(ApiResponse.success("Tenant application approved successfully. Passkey provisioned & notified.", approved));
    }

    /**
     * 6. Reject tenant filing with reason
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<TenantApprovalResponse>> rejectTenant(
            @PathVariable Long id,
            @RequestBody(required = false) @Valid TenantRejectRequest request
    ) {
        TenantApprovalResponse rejected = adminTenantService.rejectTenant(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tenant application rejected & removed from database. Linked room marked VACANT.", rejected));
    }
}
