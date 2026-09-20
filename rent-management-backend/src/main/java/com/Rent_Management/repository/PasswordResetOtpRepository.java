package com.Rent_Management.repository;

import com.Rent_Management.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(String email);

    Optional<PasswordResetOtp> findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc(String email, String otpCode);
}
