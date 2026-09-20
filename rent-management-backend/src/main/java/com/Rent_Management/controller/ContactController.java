package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.dto.ContactRequest;
import com.Rent_Management.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class ContactController {

    private final EmailService emailService;

    @PostMapping("/dispatch")
    public ResponseEntity<ApiResponse<String>> submitContactDispatch(@RequestBody @Valid ContactRequest request) {
        log.info("[CONTACT DISPATCH] Received inquiry from '{}' <{}> regarding '{}'",
                request.getName(), request.getEmail(), request.getSubject());

        // Generate tracking reference ID
        int randomId = 1000 + new SecureRandom().nextInt(9000);
        String unitClean = request.getRoomUnit() != null ? request.getRoomUnit().replaceAll("[^0-9a-zA-Z]", "") : "402";
        String referenceId = "#DISP-" + unitClean + "-" + randomId;

        // Forward email to admin
        emailService.sendContactDispatchEmail(
                request.getName(),
                request.getEmail(),
                request.getSubject(),
                request.getMessage(),
                request.getRoomUnit(),
                request.getMobileNumber()
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Dispatch transmitted successfully to property administration.",
                referenceId
        ));
    }
}
