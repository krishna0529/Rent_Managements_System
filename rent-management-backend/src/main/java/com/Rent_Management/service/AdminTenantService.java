package com.Rent_Management.service;

import com.Rent_Management.dto.TenantApprovalResponse;
import com.Rent_Management.dto.TenantRejectRequest;

import java.util.List;

public interface AdminTenantService {

    List<TenantApprovalResponse> getPendingTenants();

    List<TenantApprovalResponse> getAllTenants(String statusFilter);

    TenantApprovalResponse getTenantById(Long id);

    TenantApprovalResponse approveTenant(Long id);

    TenantApprovalResponse approveTenant(Long id, Long roomId);

    TenantApprovalResponse approveTenant(Long id, Long roomId, Double depositAmount);

    TenantApprovalResponse rejectTenant(Long id, TenantRejectRequest request);

    long getPendingCount();
}
