package com.Rent_Management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false, unique = true, length = 50)
    private String roomId;

    @Column(name = "property_type", nullable = false, length = 100)
    private String propertyType; // e.g. "Residential Flat (2BHK)", "Commercial Shop", "1BHK Studio"

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser; // nullable if vacant

    @Column(name = "rent_amount", nullable = false)
    private Double rentAmount;

    @Column(name = "deposit_amount")
    private Double depositAmount; // security deposit in rupees (custom or 2x rent)

    @Column(name = "meter_number", nullable = false, length = 100)
    private String meterNumber; // smart sub-meter ID / serial

    @Column(name = "baseline_unit", nullable = false)
    @Builder.Default
    private Double baselineUnit = 0.0; // previous or initial meter reading in kWh

    @Column(name = "floor_number", length = 30)
    private String floorNumber;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "VACANT"; // VACANT, OCCUPIED, MAINTENANCE

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
