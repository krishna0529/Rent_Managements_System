package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.dto.UserSummaryResponse;
import com.Rent_Management.dto.UserUpdateRequest;
import com.Rent_Management.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getAllUsers() {
        List<UserSummaryResponse> users = adminUserService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users directory retrieved successfully", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getUserById(@PathVariable Long id) {
        UserSummaryResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User profile dossier retrieved", user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> updateUser(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid UserUpdateRequest request
    ) {
        UserSummaryResponse updated = adminUserService.updateUser(id, request, "Harpreet Singh (Admin)");
        return ResponseEntity.ok(ApiResponse.success("User details updated successfully in database", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        adminUserService.deleteUser(id, "Harpreet Singh (Admin)");
        return ResponseEntity.ok(ApiResponse.success("User account deleted successfully from database", null));
    }
}
