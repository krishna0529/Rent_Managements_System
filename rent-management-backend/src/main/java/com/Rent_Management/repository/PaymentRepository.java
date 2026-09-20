package com.Rent_Management.repository;

import com.Rent_Management.entity.Payment;
import com.Rent_Management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByOrderByCreatedAtDesc();

    List<Payment> findByPaymentStatusOrderByCreatedAtDesc(String paymentStatus);

    List<Payment> findByUserOrderByCreatedAtDesc(User user);

    List<Payment> findByUserAndBillingMonth(User user, String billingMonth);

    java.util.Optional<Payment> findByElectricityBill(com.Rent_Management.entity.ElectricityBill electricityBill);

    @Query("SELECT p FROM Payment p ORDER BY COALESCE(p.paymentDate, p.updatedAt, p.createdAt) DESC")
    List<Payment> findAllOrderByLatestActivityDesc();

    @Query("SELECT p FROM Payment p WHERE p.amountPaid > 0 ORDER BY COALESCE(p.paymentDate, p.updatedAt, p.createdAt) DESC")
    List<Payment> findCompletedPayments();

    @Query("SELECT p FROM Payment p WHERE p.paymentStatus = :status ORDER BY COALESCE(p.paymentDate, p.updatedAt, p.createdAt) DESC")
    List<Payment> findByStatusOrderByLatestActivityDesc(@Param("status") String status);

    @Query("SELECT p FROM Payment p WHERE p.paymentStatus IN ('PENDING', 'PARTIAL') ORDER BY p.createdAt DESC")
    List<Payment> findPendingPayments();

    @Query("SELECT COALESCE(SUM(p.rentAmount), 0.0) FROM Payment p WHERE p.billingMonth = :month")
    Double calculateMonthlyTotalRent(@Param("month") String month);

    @Query("SELECT COALESCE(SUM(p.rentAmount), 0.0) FROM Payment p")
    Double calculateAllTimeTotalRent();

    @Query("SELECT COALESCE(SUM(p.amountPaid), 0.0) FROM Payment p WHERE p.paymentStatus = 'PAID'")
    Double calculateTotalRealizedRevenue();

    @Query("SELECT COALESCE(SUM(p.pendingAmount), 0.0) FROM Payment p WHERE p.paymentStatus IN ('PENDING', 'PARTIAL')")
    Double calculateTotalPendingDues();
}
