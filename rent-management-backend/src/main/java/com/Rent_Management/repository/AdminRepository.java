package com.Rent_Management.repository;

import com.Rent_Management.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByGmail(String gmail);

    Optional<Admin> findByMobileNumber(String mobileNumber);

    Optional<Admin> findByGmailOrMobileNumber(String gmail, String mobileNumber);

    boolean existsByGmail(String gmail);

    boolean existsByMobileNumber(String mobileNumber);
}
