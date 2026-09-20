package com.Rent_Management.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {

    private Long id;
    private String action;
    private String performedBy;
    private String targetEntity;
    private String targetId;
    private String details;
    private String ipAddress;
    private LocalDateTime timestamp;
}
