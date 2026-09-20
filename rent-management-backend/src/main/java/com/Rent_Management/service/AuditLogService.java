package com.Rent_Management.service;

import com.Rent_Management.dto.AuditLogResponse;

import java.util.List;

public interface AuditLogService {

    void log(String action, String performedBy, String targetEntity, String targetId, String details, String ipAddress);

    List<AuditLogResponse> getRecentAuditLogs();
}
