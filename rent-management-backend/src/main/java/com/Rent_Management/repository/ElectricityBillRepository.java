package com.Rent_Management.repository;

import com.Rent_Management.entity.ElectricityBill;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ElectricityBillRepository extends JpaRepository<ElectricityBill, Long> {

    List<ElectricityBill> findAllByOrderByCreatedAtDesc();

    List<ElectricityBill> findByRoomOrderByCreatedAtDesc(Room room);

    List<ElectricityBill> findByUserOrderByCreatedAtDesc(User user);

    Optional<ElectricityBill> findTopByRoomOrderByCreatedAtDesc(Room room);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0.0) FROM ElectricityBill b WHERE b.billingMonth = :month")
    Double calculateMonthlyTotalLightBill(@Param("month") String month);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0.0) FROM ElectricityBill b")
    Double calculateAllTimeTotalLightBill();

    @Query("SELECT COALESCE(SUM(b.unitsConsumed), 0.0) FROM ElectricityBill b")
    Double calculateAllTimeTotalUnitsConsumed();
}
