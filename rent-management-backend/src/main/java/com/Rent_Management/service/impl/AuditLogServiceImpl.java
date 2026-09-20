package com.Rent_Management.service.impl;

import com.Rent_Management.dto.AuditLogResponse;
import com.Rent_Management.entity.AuditLog;
import com.Rent_Management.repository.AuditLogRepository;
import com.Rent_Management.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public void log(String action, String performedBy, String targetEntity, String targetId, String details, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .performedBy(performedBy != null ? performedBy : "Admin System")
                    .targetEntity(targetEntity)
                    .targetId(targetId)
                    .details(details)
                    .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                    .build();
            auditLogRepository.save(auditLog);
            log.info("[AUDIT] Action: {}, Entity: {} ({}), By: {}", action, targetEntity, targetId, performedBy);
        } catch (Exception e) {
            log.error("[AUDIT] Failed to persist audit log: {}", e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getRecentAuditLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc()
                .stream()
                .map(log -> AuditLogResponse.builder()
                        .id(log.getId())
                        .action(log.getAction())
                        .performedBy(log.getPerformedBy())
                        .targetEntity(log.getTargetEntity())
                        .targetId(log.getTargetId())
                        .details(log.getDetails())
                        .ipAddress(log.getIpAddress())
                        .timestamp(log.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }
}
