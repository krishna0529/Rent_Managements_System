package com.Rent_Management.controller;

import com.Rent_Management.dto.*;
import com.Rent_Management.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AuthController {

    private final AuthService authService;

    /**
     * 1. Register a new member with profile identity and Aadhaar documents
     */
    @PostMapping(value = "/register", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @ModelAttribute @Valid RegisterRequest request,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestParam(value = "aadhaarDocument", required = false) MultipartFile aadhaarDocument
    ) {
        AuthResponse response = authService.register(request, profileImage, aadhaarDocument);
        return new ResponseEntity<>(ApiResponse.success("Member account created and authenticated successfully", response), HttpStatus.CREATED);
    }

    /**
     * 2. Login using Username or Email and password
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody @Valid LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Session authorized successfully", response));
    }

    /**
     * 3. Forgot Password - Generates & dispatches 6-digit OTP
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        authService.processForgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("A 6-digit verification code has been generated and dispatched to your email."));
    }

    /**
     * 4. Verify OTP
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@RequestBody @Valid VerifyOtpRequest request) {
        boolean isValid = authService.verifyOtp(request);
        if (isValid) {
            return ResponseEntity.ok(ApiResponse.success("OTP verified successfully.", true));
        } else {
            return new ResponseEntity<>(ApiResponse.error("Invalid or expired OTP verification code."), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * 5. Reset Password using verified OTP
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset verified and updated successfully. Please sign in with your new credentials."));
    }

    /**
     * 6. Fetch current authenticated user's profile from database
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return new ResponseEntity<>(ApiResponse.error("Missing or invalid Authorization header."), HttpStatus.UNAUTHORIZED);
        }
        UserProfileResponse profile = authService.getCurrentUserProfile(authHeader);
        return ResponseEntity.ok(ApiResponse.success("User profile fetched successfully", profile));
    }
}
