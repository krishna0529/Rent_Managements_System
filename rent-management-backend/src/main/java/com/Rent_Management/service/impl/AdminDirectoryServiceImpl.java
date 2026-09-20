package com.Rent_Management.service.impl;

import com.Rent_Management.dto.AdminCreateRequest;
import com.Rent_Management.dto.AdminProfileResponse;
import com.Rent_Management.dto.AdminUpdateRequest;
import com.Rent_Management.entity.Admin;
import com.Rent_Management.exception.DuplicateResourceException;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.AdminRepository;
import com.Rent_Management.service.AdminDirectoryService;
import com.Rent_Management.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDirectoryServiceImpl implements AdminDirectoryService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<AdminProfileResponse> getAllAdmins() {
        return adminRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdminProfileResponse getAdminById(Long id) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Administrator not found with id: " + id));
        return mapToResponse(admin);
    }

    @Override
    @Transactional
    public AdminProfileResponse createAdmin(AdminCreateRequest request, String performedBy) {
        String cleanGmail = request.getGmail().trim().toLowerCase();
        String cleanMobile = request.getMobileNumber().trim();

        if (adminRepository.existsByGmail(cleanGmail)) {
            throw new DuplicateResourceException("An administrator with email " + cleanGmail + " already exists.");
        }
        if (adminRepository.existsByMobileNumber(cleanMobile)) {
            throw new DuplicateResourceException("An administrator with mobile number " + cleanMobile + " already exists.");
        }

        Admin admin = Admin.builder()
                .fullName(request.getFullName().trim())
                .gmail(cleanGmail)
                .mobileNumber(cleanMobile)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null && !request.getRole().isBlank() ? request.getRole().trim().toUpperCase() : "ROLE_ADMIN")
                .isActive(request.isActive())
                .build();

        Admin saved = adminRepository.save(admin);

        auditLogService.log(
                "ADMIN_PROVISIONED",
                performedBy,
                "Admin",
                String.valueOf(saved.getId()),
                "Provisioned new administrator: " + saved.getFullName() + " (" + saved.getGmail() + ") with role: " + saved.getRole(),
                "127.0.0.1"
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public AdminProfileResponse updateAdmin(Long id, AdminUpdateRequest request, String performedBy) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Administrator not found with id: " + id));

        String cleanGmail = request.getGmail().trim().toLowerCase();
        String cleanMobile = request.getMobileNumber().trim();

        // Check uniqueness if email or mobile changed
        if (!admin.getGmail().equalsIgnoreCase(cleanGmail) && adminRepository.existsByGmail(cleanGmail)) {
            throw new DuplicateResourceException("An administrator with email " + cleanGmail + " already exists.");
        }
        if (!admin.getMobileNumber().equalsIgnoreCase(cleanMobile) && adminRepository.existsByMobileNumber(cleanMobile)) {
            throw new DuplicateResourceException("An administrator with mobile number " + cleanMobile + " already exists.");
        }

        admin.setFullName(request.getFullName().trim());
        admin.setGmail(cleanGmail);
        admin.setMobileNumber(cleanMobile);
        admin.setRole(request.getRole() != null && !request.getRole().isBlank() ? request.getRole().trim().toUpperCase() : "ROLE_ADMIN");
        admin.setActive(request.isActive());

        // Update password if provided
        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            admin.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
            log.info("[ADMIN DIRECTORY] Password updated for admin ID {}", id);
        }

        Admin updated = adminRepository.save(admin);

        auditLogService.log(
                "ADMIN_UPDATED",
                performedBy,
                "Admin",
                String.valueOf(updated.getId()),
                "Updated administrator: " + updated.getFullName() + " (" + updated.getGmail() + ")",
                "127.0.0.1"
        );

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteAdmin(Long id, String performedBy) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Administrator not found with id: " + id));

        String email = admin.getGmail();
        String name = admin.getFullName();

        adminRepository.delete(admin);

        auditLogService.log(
                "ADMIN_DELETED",
                performedBy,
                "Admin",
                String.valueOf(id),
                "Deleted administrator: " + name + " (" + email + ")",
                "127.0.0.1"
        );

        log.info("[ADMIN DIRECTORY] Administrator id={} ({}) permanently deleted by {}", id, email, performedBy);
    }

    @Override
    @Transactional
    public void purgeDefaultPrimaryAdmin(String performedBy) {
        adminRepository.findByGmail("admin@gmail.com").ifPresent(admin -> {
            Long id = admin.getId();
            adminRepository.delete(admin);
            auditLogService.log(
                    "DEFAULT_ADMIN_PURGED",
                    performedBy,
                    "Admin",
                    String.valueOf(id),
                    "Purged default seed primary administrator account: admin@gmail.com (Harpreet Singh)",
                    "127.0.0.1"
            );
            log.info("[ADMIN DIRECTORY] Default primary admin (admin@gmail.com) purged successfully.");
        });
    }

    private AdminProfileResponse mapToResponse(Admin admin) {
        return AdminProfileResponse.builder()
                .id(admin.getId())
                .fullName(admin.getFullName())
                .mobileNumber(admin.getMobileNumber())
                .gmail(admin.getGmail())
                .profileImagePath(admin.getProfileImagePath())
                .role(admin.getRole())
                .active(admin.isActive())
                .createdAt(admin.getCreatedAt())
                .build();
    }
}
