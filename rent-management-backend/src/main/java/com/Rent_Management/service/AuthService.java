package com.Rent_Management.service;

import com.Rent_Management.dto.*;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {

    AuthResponse register(RegisterRequest request, MultipartFile profileImage, MultipartFile aadhaarDocument);

    AuthResponse login(LoginRequest request);

    void processForgotPassword(ForgotPasswordRequest request);

    boolean verifyOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);

    UserProfileResponse getCurrentUserProfile(String token);
}
