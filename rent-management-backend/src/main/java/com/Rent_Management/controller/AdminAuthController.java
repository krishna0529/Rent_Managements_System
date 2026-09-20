package com.Rent_Management.controller;

import com.Rent_Management.dto.*;
import com.Rent_Management.exception.InvalidCredentialsException;
import com.Rent_Management.service.AdminAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    private void validateAuthHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new InvalidCredentialsException("Bearer authorization token is missing or invalid");
        }
    }

    /**
     * 1. Admin Login using Gmail or Mobile and Password
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody @Valid AdminLoginRequest request) {
        AuthResponse response = adminAuthService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Admin authorized successfully", response));
    }

    /**
     * 2. Fetch current Admin Profile details directly from the 'admin' table
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> getCurrentAdminProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        validateAuthHeader(authHeader);
        AdminProfileResponse profile = adminAuthService.getCurrentAdminProfile(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Admin profile fetched successfully from admin table", profile));
    }

    /**
     * 3. Update Admin Full Name in database
     */
    @PutMapping("/update-name")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> updateFullName(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid AdminUpdateNameRequest request
    ) {
        validateAuthHeader(authHeader);
        AdminProfileResponse updated = adminAuthService.updateFullName(authHeader, request);
        return ResponseEntity.ok(ApiResponse.success("Admin legal full name updated successfully in database", updated));
    }

    /**
     * 4. Upload & Update Admin Profile Image in database
     */
    @PostMapping(value = "/upload-avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AdminProfileResponse>> uploadAvatar(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("avatar") MultipartFile avatar
    ) {
        validateAuthHeader(authHeader);
        AdminProfileResponse updated = adminAuthService.uploadAvatar(authHeader, avatar);
        return ResponseEntity.ok(ApiResponse.success("Admin profile photo uploaded and saved successfully in database", updated));
    }

    /**
     * 5. Change Admin Password in database
     */
    @PutMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid AdminChangePasswordRequest request
    ) {
        validateAuthHeader(authHeader);
        adminAuthService.changePassword(authHeader, request);
        return ResponseEntity.ok(ApiResponse.success("Master administrative password successfully updated in database", null));
    }

    /**
     * 6. Request 6-digit verification OTP to change Admin Gmail
     */
    @PostMapping("/request-email-otp")
    public ResponseEntity<ApiResponse<Void>> requestEmailChangeOtp(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid AdminEmailOtpRequest request
    ) {
        validateAuthHeader(authHeader);
        adminAuthService.requestEmailChangeOtp(authHeader, request);
        return ResponseEntity.ok(ApiResponse.success("A 6-digit verification OTP has been generated for " + request.getNewEmail() + ". Check system logs or email.", null));
    }

    /**
     * 7. Verify OTP and Update Admin Gmail in database
     */
    @PostMapping("/verify-update-email")
    public ResponseEntity<ApiResponse<AdminEmailUpdateResponse>> verifyAndUpdateEmail(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid AdminVerifyEmailRequest request
    ) {
        validateAuthHeader(authHeader);
        AdminEmailUpdateResponse response = adminAuthService.verifyAndUpdateEmail(authHeader, request);
        return ResponseEntity.ok(ApiResponse.success("Admin Gmail verified and updated successfully in database", response));
    }
}
