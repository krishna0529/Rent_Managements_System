package com.Rent_Management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action", nullable = false, length = 100)
    private String action; // e.g. "ROOM_CREATED", "BILL_GENERATED", "PAYMENT_RECORDED", "USER_UPDATED"

    @Column(name = "performed_by", nullable = false, length = 150)
    private String performedBy; // admin username or email

    @Column(name = "target_entity", length = 100)
    private String targetEntity; // e.g. "Room", "ElectricityBill", "Payment", "User"

    @Column(name = "target_id", length = 100)
    private String targetId;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;
}
