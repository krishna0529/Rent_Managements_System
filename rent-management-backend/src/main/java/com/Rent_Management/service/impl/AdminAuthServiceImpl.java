package com.Rent_Management.service.impl;

import com.Rent_Management.dto.*;
import com.Rent_Management.entity.Admin;
import com.Rent_Management.entity.PasswordResetOtp;
import com.Rent_Management.exception.DuplicateResourceException;
import com.Rent_Management.exception.InvalidCredentialsException;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.AdminRepository;
import com.Rent_Management.repository.PasswordResetOtpRepository;
import com.Rent_Management.security.JwtTokenProvider;
import com.Rent_Management.service.AdminAuthService;
import com.Rent_Management.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuthServiceImpl implements AdminAuthService {

    private final AdminRepository adminRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final FileStorageService fileStorageService;
    private final com.Rent_Management.service.EmailService emailService;

    @Override
    @Transactional
    public AuthResponse login(AdminLoginRequest request) {
        String identifier = request.getIdentifier().trim();

        Admin admin = adminRepository.findByGmailOrMobileNumber(identifier, identifier)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid admin credentials. Account not recognized."));

        boolean passwordMatches = false;
        String storedPassword = admin.getPassword();
        if (storedPassword != null && (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$"))) {
            passwordMatches = passwordEncoder.matches(request.getPassword(), storedPassword);
        } else if (storedPassword != null) {
            passwordMatches = storedPassword.equals(request.getPassword());
            if (passwordMatches) {
                admin.setPassword(passwordEncoder.encode(request.getPassword()));
                adminRepository.save(admin);
            }
        }

        if (!passwordMatches) {
            throw new InvalidCredentialsException("Invalid password. Authentication failed.");
        }

        if (!admin.isActive()) {
            throw new InvalidCredentialsException("Admin account is deactivated. Contact system owner.");
        }

        String token = jwtTokenProvider.generateToken(admin.getGmail(), admin.getRole());

        log.info("[ADMIN AUTH] Admin '{}' ({}) successfully logged in.", admin.getFullName(), admin.getGmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(admin.getId())
                .username(admin.getGmail())
                .email(admin.getGmail())
                .fullName(admin.getFullName())
                .role(admin.getRole())
                .profileImagePath(admin.getProfileImagePath())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminProfileResponse getCurrentAdminProfile(String token) {
        Admin admin = getAdminFromToken(token);
        return mapToProfileResponse(admin);
    }

    @Override
    @Transactional
    public AdminProfileResponse updateFullName(String token, AdminUpdateNameRequest request) {
        Admin admin = getAdminFromToken(token);
        admin.setFullName(request.getFullName().trim());
        Admin updated = adminRepository.save(admin);
        log.info("[ADMIN SETTINGS] Full name updated to '{}' for admin ID: {}", updated.getFullName(), updated.getId());
        return mapToProfileResponse(updated);
    }

    @Override
    @Transactional
    public AdminProfileResponse uploadAvatar(String token, MultipartFile avatarFile) {
        Admin admin = getAdminFromToken(token);
        String imagePath = fileStorageService.storeFile(avatarFile, "avatars");
        if (imagePath != null) {
            admin.setProfileImagePath(imagePath);
            Admin updated = adminRepository.save(admin);
            log.info("[ADMIN SETTINGS] Avatar updated to '{}' for admin ID: {}", imagePath, updated.getId());
            return mapToProfileResponse(updated);
        }
        return mapToProfileResponse(admin);
    }

    @Override
    @Transactional
    public void changePassword(String token, AdminChangePasswordRequest request) {
        Admin admin = getAdminFromToken(token);
        if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPassword())) {
            throw new InvalidCredentialsException("Current administrative password does not match.");
        }
        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        adminRepository.save(admin);
        log.info("[ADMIN SETTINGS] Master password successfully updated for admin ID: {}", admin.getId());
    }

    @Override
    @Transactional
    public void requestEmailChangeOtp(String token, AdminEmailOtpRequest request) {
        Admin admin = getAdminFromToken(token);
        String newEmail = request.getNewEmail().trim().toLowerCase();

        if (admin.getGmail().equalsIgnoreCase(newEmail)) {
            throw new DuplicateResourceException("The new email is already your current registered email.");
        }

        if (adminRepository.existsByGmail(newEmail)) {
            throw new DuplicateResourceException("Gmail '" + newEmail + "' is already registered to an admin account.");
        }

        SecureRandom random = new SecureRandom();
        int otpNumber = 100000 + random.nextInt(900000);
        String otpCode = String.valueOf(otpNumber);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        PasswordResetOtp otpEntity = PasswordResetOtp.builder()
                .email(newEmail)
                .otpCode(otpCode)
                .expiresAt(expiresAt)
                .isUsed(false)
                .build();

        otpRepository.save(otpEntity);

        // Dispatch real email from krishnasingh9697@gmail.com to newEmail
        emailService.sendAdminEmailOtp(newEmail, otpCode);

        log.info("===============================================================");
        log.info("[ADMIN EMAIL CHANGE OTP] Verification OTP for {}: {}", newEmail, otpCode);
        log.info("[ADMIN EMAIL CHANGE OTP] Valid until: {}", expiresAt);
        log.info("===============================================================");
    }

    @Override
    @Transactional
    public AdminEmailUpdateResponse verifyAndUpdateEmail(String token, AdminVerifyEmailRequest request) {
        Admin admin = getAdminFromToken(token);
        String newEmail = request.getNewEmail().trim().toLowerCase();

        PasswordResetOtp otpEntity = otpRepository
                .findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc(newEmail, request.getOtp().trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid or expired 6-digit OTP code for email: " + newEmail));

        if (otpEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidCredentialsException("This OTP has expired. Please request a new verification code.");
        }

        if (adminRepository.existsByGmail(newEmail) && !admin.getGmail().equalsIgnoreCase(newEmail)) {
            throw new DuplicateResourceException("Gmail '" + newEmail + "' is already registered.");
        }

        otpEntity.setUsed(true);
        otpRepository.save(otpEntity);

        admin.setGmail(newEmail);
        Admin updated = adminRepository.save(admin);

        String newToken = jwtTokenProvider.generateToken(updated.getGmail(), updated.getRole());

        log.info("[ADMIN SETTINGS] Admin Gmail successfully updated to '{}' for ID: {}", newEmail, updated.getId());

        return AdminEmailUpdateResponse.builder()
                .token(newToken)
                .profile(mapToProfileResponse(updated))
                .build();
    }

    private Admin getAdminFromToken(String token) {
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        String identifier = jwtTokenProvider.getUsernameFromToken(cleanToken);

        return adminRepository.findByGmail(identifier)
                .or(() -> adminRepository.findByMobileNumber(identifier))
                .orElseThrow(() -> new ResourceNotFoundException("Admin record not found for: " + identifier));
    }

    private AdminProfileResponse mapToProfileResponse(Admin admin) {
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
