package com.Rent_Management.repository;

import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomId(String roomId);

    boolean existsByRoomId(String roomId);

    List<Room> findAllByOrderByCreatedAtDesc();

    List<Room> findByStatus(String status);

    Optional<Room> findByAssignedUser(User user);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(r.rentAmount), 0.0) FROM Room r WHERE r.status = 'OCCUPIED'")
    Double calculateMonthlyExpectedRent();
}
