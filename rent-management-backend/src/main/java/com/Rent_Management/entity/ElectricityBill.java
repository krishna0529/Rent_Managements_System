package com.Rent_Management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "electricity_bills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectricityBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "billing_month", nullable = false, length = 50)
    private String billingMonth; // e.g. "October 2024"

    @Column(name = "previous_unit", nullable = false)
    private Double previousUnit; // baseline / previous meter reading

    @Column(name = "current_unit", nullable = false)
    private Double currentUnit; // current meter reading

    @Column(name = "units_consumed", nullable = false)
    private Double unitsConsumed; // (current_unit - previous_unit)

    @Column(name = "rate_per_unit", nullable = false)
    @Builder.Default
    private Double ratePerUnit = 6.0; // 6 Rs per kWh unit

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount; // units_consumed * rate_per_unit

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PAID

    @Column(name = "bill_date", nullable = false)
    private LocalDate billDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void calculateFields() {
        if (this.currentUnit != null && this.previousUnit != null) {
            this.unitsConsumed = Math.max(0.0, this.currentUnit - this.previousUnit);
        } else {
            this.unitsConsumed = 0.0;
        }
        if (this.ratePerUnit == null) {
            this.ratePerUnit = 6.0;
        }
        this.totalAmount = this.unitsConsumed * this.ratePerUnit;
    }
}
