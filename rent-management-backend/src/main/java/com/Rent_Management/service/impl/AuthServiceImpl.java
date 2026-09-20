package com.Rent_Management.service.impl;

import com.Rent_Management.dto.*;
import com.Rent_Management.entity.PasswordResetOtp;
import com.Rent_Management.entity.Role;
import com.Rent_Management.entity.User;
import com.Rent_Management.entity.UserStatus;
import com.Rent_Management.exception.DuplicateResourceException;
import com.Rent_Management.exception.InvalidCredentialsException;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.PasswordResetOtpRepository;
import com.Rent_Management.repository.UserRepository;
import com.Rent_Management.security.JwtTokenProvider;
import com.Rent_Management.service.AuthService;
import com.Rent_Management.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final FileStorageService fileStorageService;
    private final com.Rent_Management.service.EmailService emailService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request, MultipartFile profileImage, MultipartFile aadhaarDocument) {
        // 1. Check duplicate username
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken.");
        }

        // 2. Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email address '" + request.getEmail() + "' is already registered.");
        }

        // 3. Check duplicate mobile number
        if (userRepository.existsByMobileNumber(request.getMobileNumber())) {
            throw new DuplicateResourceException("Mobile number '" + request.getMobileNumber() + "' is already registered.");
        }

        // 4. Check duplicate Aadhaar number
        if (userRepository.existsByAadhaarNumber(request.getAadhaarNumber())) {
            throw new DuplicateResourceException("Aadhaar card number '" + request.getAadhaarNumber() + "' is already registered.");
        }

        // 5. Store files if provided
        String profileImagePath = fileStorageService.storeFile(profileImage, "avatars");
        String aadhaarDocPath = fileStorageService.storeFile(aadhaarDocument, "documents");

        // 6. Build User entity
        LocalDate parsedDate = LocalDate.parse(request.getDateOfJoining());

        User user = User.builder()
                .fullName(request.getFullName())
                .username(request.getUsername())
                .email(request.getEmail())
                .mobileNumber(request.getMobileNumber())
                .fullAddress(request.getFullAddress())
                .aadhaarNumber(request.getAadhaarNumber())
                .aadhaarDocumentPath(aadhaarDocPath)
                .profileImagePath(profileImagePath)
                .dateOfJoining(parsedDate)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .isActive(false)
                .status(UserStatus.PENDING)
                .build();

        User savedUser = userRepository.save(user);

        // 7. Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser.getUsername(), savedUser.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole().name())
                .profileImagePath(savedUser.getProfileImagePath())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameOrEmail(request.getIdentifier(), request.getIdentifier())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username/email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid username/email or password");
        }

        // Verification & Approval Guard
        if (user.getStatus() == UserStatus.PENDING) {
            throw new InvalidCredentialsException("ACCOUNT_PENDING: Your registration is currently PENDING approval by Administration. Please wait for landlord verification.");
        }

        if (user.getStatus() == UserStatus.REJECTED) {
            throw new InvalidCredentialsException("ACCOUNT_REJECTED: Your registration was REJECTED by Administration. Please contact management.");
        }

        if (!user.isActive()) {
            throw new InvalidCredentialsException("Account is currently deactivated. Please contact support.");
        }

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .profileImagePath(user.getProfileImagePath())
                .build();
    }

    @Override
    @Transactional
    public void processForgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No member account found with email: " + request.getEmail()));

        // Generate cryptographically secure 6-digit OTP
        SecureRandom random = new SecureRandom();
        int otpNumber = 100000 + random.nextInt(900000);
        String otpCode = String.valueOf(otpNumber);

        // 10 minutes expiry
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(10);

        PasswordResetOtp otpEntity = PasswordResetOtp.builder()
                .email(user.getEmail())
                .otpCode(otpCode)
                .expiresAt(expiresAt)
                .isUsed(false)
                .build();

        otpRepository.save(otpEntity);

        // Dispatch OTP to user's registered email address
        emailService.sendPasswordResetOtp(user.getEmail(), otpCode);

        log.info("===============================================================");
        log.info("[AUTH RECOVERY NODE] Generated 6-digit OTP for {}: {}", user.getEmail(), otpCode);
        log.info("[AUTH RECOVERY NODE] OTP is valid until: {}", expiresAt);
        log.info("===============================================================");
    }

    @Override
    public boolean verifyOtp(VerifyOtpRequest request) {
        return otpRepository.findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc(request.getEmail(), request.getOtp())
                .filter(otp -> otp.getExpiresAt().isAfter(LocalDateTime.now()))
                .isPresent();
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetOtp otpEntity = otpRepository
                .findTopByEmailAndOtpCodeAndIsUsedFalseOrderByCreatedAtDesc(request.getEmail(), request.getOtp())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid or expired 6-digit OTP"));

        if (otpEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidCredentialsException("This OTP has expired. Please request a new verification code.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        // Hash and update new password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Mark OTP as used
        otpEntity.setUsed(true);
        otpRepository.save(otpEntity);

        log.info("[AUTH RECOVERY NODE] Password successfully reset for user: {}", user.getEmail());
    }

    /**
     * Retrieve the profile of the currently authenticated user from token.
     */
    @Override
    public UserProfileResponse getCurrentUserProfile(String token) {
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        String username = jwtTokenProvider.getUsernameFromToken(cleanToken);

        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with identifier: " + username));

        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .fullAddress(user.getFullAddress())
                .aadhaarNumber(user.getAadhaarNumber())
                .aadhaarDocumentPath(user.getAadhaarDocumentPath())
                .profileImagePath(user.getProfileImagePath())
                .dateOfJoining(user.getDateOfJoining())
                .role(user.getRole().name())
                .isActive(user.isActive())
                .build();
    }
}
