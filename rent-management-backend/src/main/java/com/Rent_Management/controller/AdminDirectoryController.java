package com.Rent_Management.controller;

import com.Rent_Management.dto.AdminCreateRequest;
import com.Rent_Management.dto.AdminProfileResponse;
import com.Rent_Management.dto.AdminUpdateRequest;
import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.security.JwtTokenProvider;
import com.Rent_Management.service.AdminDirectoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/directory")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AdminDirectoryController {

    private final AdminDirectoryService adminDirectoryService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminProfileResponse>>> getAllAdmins() {
        List<AdminProfileResponse> admins = adminDirectoryService.getAllAdmins();
        return ResponseEntity.ok(ApiResponse.success("Administrator directory retrieved successfully", admins));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> getAdminById(@PathVariable Long id) {
        AdminProfileResponse response = adminDirectoryService.getAdminById(id);
        return ResponseEntity.ok(ApiResponse.success("Administrator dossier retrieved successfully", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminProfileResponse>> createAdmin(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid AdminCreateRequest request
    ) {
        String actor = extractActor(authHeader);
        AdminProfileResponse created = adminDirectoryService.createAdmin(request, actor);
        return ResponseEntity.ok(ApiResponse.success("Administrator provisioned successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminProfileResponse>> updateAdmin(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid AdminUpdateRequest request
    ) {
        String actor = extractActor(authHeader);
        AdminProfileResponse updated = adminDirectoryService.updateAdmin(id, request, actor);
        return ResponseEntity.ok(ApiResponse.success("Administrator profile updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAdmin(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String actor = extractActor(authHeader);
        adminDirectoryService.deleteAdmin(id, actor);
        return ResponseEntity.ok(ApiResponse.success("Administrator deleted permanently from database", null));
    }

    @DeleteMapping("/default-primary")
    public ResponseEntity<ApiResponse<Void>> purgeDefaultPrimaryAdmin(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String actor = extractActor(authHeader);
        adminDirectoryService.purgeDefaultPrimaryAdmin(actor);
        return ResponseEntity.ok(ApiResponse.success("Default primary administrator (admin@gmail.com) purged successfully", null));
    }

    private String extractActor(String authHeader) {
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                String username = jwtTokenProvider.getUsernameFromToken(token);
                if (StringUtils.hasText(username)) {
                    return username + " (Admin)";
                }
            } catch (Exception e) {
                log.warn("[ADMIN DIRECTORY] Could not extract actor from token: {}", e.getMessage());
            }
        }
        return "Admin Portal";
    }
}
