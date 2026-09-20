package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.dto.AuditLogResponse;
import com.Rent_Management.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAuditLogs() {
        List<AuditLogResponse> logs = auditLogService.getRecentAuditLogs();
        return ResponseEntity.ok(ApiResponse.success("System audit logs retrieved successfully from database", logs));
    }
}
