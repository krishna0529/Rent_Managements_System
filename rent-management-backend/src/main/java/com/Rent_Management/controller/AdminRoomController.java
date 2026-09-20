package com.Rent_Management.controller;

import com.Rent_Management.dto.ApiResponse;
import com.Rent_Management.dto.RoomRequest;
import com.Rent_Management.dto.RoomResponse;
import com.Rent_Management.dto.UserDropdownResponse;
import com.Rent_Management.service.AdminRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/rooms")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class AdminRoomController {

    private final AdminRoomService adminRoomService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getAllRooms() {
        List<RoomResponse> rooms = adminRoomService.getAllRooms();
        return ResponseEntity.ok(ApiResponse.success("Rooms inventory retrieved successfully", rooms));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomById(@PathVariable Long id) {
        RoomResponse response = adminRoomService.getRoomById(id);
        return ResponseEntity.ok(ApiResponse.success("Room details retrieved successfully", response));
    }

    @GetMapping("/users-dropdown")
    public ResponseEntity<ApiResponse<List<UserDropdownResponse>>> getUsersDropdown() {
        List<UserDropdownResponse> users = adminRoomService.getAvailableUsers();
        return ResponseEntity.ok(ApiResponse.success("Users for room assignment retrieved", users));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid RoomRequest request
    ) {
        RoomResponse created = adminRoomService.createRoom(request, "Harpreet Singh (Admin)");
        return ResponseEntity.ok(ApiResponse.success("Property unit provisioned & saved successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody @Valid RoomRequest request
    ) {
        RoomResponse updated = adminRoomService.updateRoom(id, request, "Harpreet Singh (Admin)");
        return ResponseEntity.ok(ApiResponse.success("Room property details updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        adminRoomService.deleteRoom(id, "Harpreet Singh (Admin)");
        return ResponseEntity.ok(ApiResponse.success("Property unit removed from inventory", null));
    }
}
