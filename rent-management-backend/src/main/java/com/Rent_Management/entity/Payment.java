package com.Rent_Management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "electricity_bill_id")
    private ElectricityBill electricityBill;

    @Column(name = "billing_month", nullable = false, length = 50)
    private String billingMonth; // e.g. "October 2024"

    @Column(name = "rent_amount", nullable = false)
    private Double rentAmount;

    @Column(name = "electricity_amount", nullable = false)
    @Builder.Default
    private Double electricityAmount = 0.0;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount; // rent_amount + electricity_amount

    @Column(name = "amount_paid", nullable = false)
    @Builder.Default
    private Double amountPaid = 0.0;

    @Column(name = "pending_amount", nullable = false)
    @Builder.Default
    private Double pendingAmount = 0.0;

    @Column(name = "payment_status", nullable = false, length = 30)
    @Builder.Default
    private String paymentStatus = "PENDING"; // PENDING, PAID, PARTIAL

    @Column(name = "payment_mode", length = 50)
    private String paymentMode; // UPI, CASH, BANK_TRANSFER, CHEQUE

    @Column(name = "transaction_reference", length = 100)
    private String transactionReference;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void calculateTotals() {
        if (this.rentAmount == null) this.rentAmount = 0.0;
        if (this.electricityAmount == null) this.electricityAmount = 0.0;
        this.totalAmount = this.rentAmount + this.electricityAmount;
        if (this.amountPaid == null) this.amountPaid = 0.0;
        this.pendingAmount = Math.max(0.0, this.totalAmount - this.amountPaid);
        if ("FAILED".equalsIgnoreCase(this.paymentStatus)) {
            // Retain explicit FAILED status
            return;
        }
        if (this.pendingAmount <= 0.0 && this.amountPaid > 0.0) {
            this.paymentStatus = "PAID";
        } else if (this.amountPaid > 0.0) {
            this.paymentStatus = "PARTIAL";
        } else {
            this.paymentStatus = "PENDING";
        }
    }
}
