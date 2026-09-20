package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.dto.ElectricityBillRequest;
import com.Rent_Management.dto.ElectricityBillResponse;
import com.Rent_Management.service.AdminBillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/bills")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AdminBillController {

    private final AdminBillService adminBillService;
    private final com.Rent_Management.security.JwtTokenProvider jwtTokenProvider;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ElectricityBillResponse>>> getAllBills() {
        List<ElectricityBillResponse> bills = adminBillService.getAllBills();
        return ResponseEntity.ok(ApiResponse.success("Electricity bills retrieved successfully", bills));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ElectricityBillResponse>> getBillById(@PathVariable Long id) {
        ElectricityBillResponse bill = adminBillService.getBillById(id);
        return ResponseEntity.ok(ApiResponse.success("Electricity bill details retrieved", bill));
    }

    @GetMapping("/room/{roomId}/latest-unit")
    public ResponseEntity<ApiResponse<Double>> getLatestUnitForRoom(@PathVariable Long roomId) {
        Double latestUnit = adminBillService.getLatestUnitForRoom(roomId);
        return ResponseEntity.ok(ApiResponse.success("Previous light unit fetched for room", latestUnit));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ElectricityBillResponse>> createBill(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid ElectricityBillRequest request
    ) {
        String actor = extractActor(authHeader);
        ElectricityBillResponse created = adminBillService.createBill(request, actor);
        return ResponseEntity.ok(ApiResponse.success("Electricity bill generated & logged successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ElectricityBillResponse>> updateBill(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid ElectricityBillRequest request
    ) {
        String actor = extractActor(authHeader);
        ElectricityBillResponse updated = adminBillService.updateBill(id, request, actor);
        return ResponseEntity.ok(ApiResponse.success("Electricity bill updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBill(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        String actor = extractActor(authHeader);
        adminBillService.deleteBill(id, actor);
        return ResponseEntity.ok(ApiResponse.success("Electricity bill record removed", null));
    }

    private String extractActor(String authHeader) {
        if (org.springframework.util.StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                String username = jwtTokenProvider.getUsernameFromToken(token);
                if (org.springframework.util.StringUtils.hasText(username)) {
                    return username + " (Admin)";
                }
            } catch (Exception ignored) {
            }
        }
        return "Admin Portal";
    }
}
