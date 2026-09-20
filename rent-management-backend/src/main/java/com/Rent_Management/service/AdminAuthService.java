package com.Rent_Management.service;

import com.Rent_Management.dto.*;
import org.springframework.web.multipart.MultipartFile;

public interface AdminAuthService {

    AuthResponse login(AdminLoginRequest request);

    AdminProfileResponse getCurrentAdminProfile(String token);

    AdminProfileResponse updateFullName(String token, AdminUpdateNameRequest request);

    AdminProfileResponse uploadAvatar(String token, MultipartFile avatarFile);

    void changePassword(String token, AdminChangePasswordRequest request);

    void requestEmailChangeOtp(String token, AdminEmailOtpRequest request);

    AdminEmailUpdateResponse verifyAndUpdateEmail(String token, AdminVerifyEmailRequest request);
}
