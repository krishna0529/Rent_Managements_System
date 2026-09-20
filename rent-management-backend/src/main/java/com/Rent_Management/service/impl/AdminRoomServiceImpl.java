package com.Rent_Management.service.impl;

import com.Rent_Management.dto.RoomRequest;
import com.Rent_Management.dto.RoomResponse;
import com.Rent_Management.dto.UserDropdownResponse;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import com.Rent_Management.exception.BadRequestException;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.repository.UserRepository;
import com.Rent_Management.service.AdminRoomService;
import com.Rent_Management.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminRoomServiceImpl implements AdminRoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<RoomResponse> getAllRooms() {
        return roomRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));
        return mapToResponse(room);
    }

    @Override
    @Transactional
    public RoomResponse createRoom(RoomRequest request, String performedBy) {
        if (roomRepository.existsByRoomId(request.getRoomId().trim())) {
            throw new BadRequestException("Room ID already exists: " + request.getRoomId());
        }

        User user = null;
        if (request.getAssignedUserId() != null) {
            user = userRepository.findById(request.getAssignedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getAssignedUserId()));
        }

        String initialStatus = request.getStatus();
        if (initialStatus == null || initialStatus.isBlank()) {
            initialStatus = (user != null) ? "OCCUPIED" : "VACANT";
        }

        Room room = Room.builder()
                .roomId(request.getRoomId().trim())
                .propertyType(request.getPropertyType().trim())
                .assignedUser(user)
                .rentAmount(request.getRentAmount())
                .meterNumber(request.getMeterNumber().trim())
                .baselineUnit(request.getBaselineUnit() != null ? request.getBaselineUnit() : 0.0)
                .floorNumber(request.getFloorNumber())
                .status(initialStatus)
                .build();

        Room saved = roomRepository.save(room);

        auditLogService.log(
                "ROOM_CREATED",
                performedBy,
                "Room",
                saved.getRoomId(),
                "Provisioned property unit: " + saved.getRoomId() + " (" + saved.getPropertyType() + ") with rent ₹" + saved.getRentAmount(),
                null
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public RoomResponse updateRoom(Long id, RoomRequest request, String performedBy) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));

        if (!room.getRoomId().equalsIgnoreCase(request.getRoomId().trim())) {
            if (roomRepository.existsByRoomId(request.getRoomId().trim())) {
                throw new BadRequestException("Room ID already exists: " + request.getRoomId());
            }
            room.setRoomId(request.getRoomId().trim());
        }

        User user = null;
        if (request.getAssignedUserId() != null) {
            user = userRepository.findById(request.getAssignedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getAssignedUserId()));
        }
        room.setAssignedUser(user);
        room.setPropertyType(request.getPropertyType().trim());
        room.setRentAmount(request.getRentAmount());
        room.setMeterNumber(request.getMeterNumber().trim());
        if (request.getBaselineUnit() != null) {
            room.setBaselineUnit(request.getBaselineUnit());
        }
        if (request.getFloorNumber() != null) {
            room.setFloorNumber(request.getFloorNumber());
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            room.setStatus(request.getStatus());
        } else {
            room.setStatus(user != null ? "OCCUPIED" : "VACANT");
        }

        Room updated = roomRepository.save(room);

        auditLogService.log(
                "ROOM_UPDATED",
                performedBy,
                "Room",
                updated.getRoomId(),
                "Updated details for unit " + updated.getRoomId() + " (Rent: ₹" + updated.getRentAmount() + ", Status: " + updated.getStatus() + ")",
                null
        );

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteRoom(Long id, String performedBy) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));

        String code = room.getRoomId();
        roomRepository.delete(room);

        auditLogService.log(
                "ROOM_DELETED",
                performedBy,
                "Room",
                code,
                "Removed unit from inventory: " + code,
                null
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDropdownResponse> getAvailableUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(u -> UserDropdownResponse.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .username(u.getUsername())
                        .mobileNumber(u.getMobileNumber())
                        .aadhaarNumber(u.getAadhaarNumber())
                        .email(u.getEmail())
                        .status(u.getStatus() != null ? u.getStatus().name() : "PENDING")
                        .active(u.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    private RoomResponse mapToResponse(Room room) {
        User u = room.getAssignedUser();
        return RoomResponse.builder()
                .id(room.getId())
                .roomId(room.getRoomId())
                .propertyType(room.getPropertyType())
                .assignedUserId(u != null ? u.getId() : null)
                .assignedUserName(u != null ? u.getFullName() : null)
                .assignedUserMobile(u != null ? u.getMobileNumber() : null)
                .assignedUserAadhaar(u != null ? u.getAadhaarNumber() : null)
                .rentAmount(room.getRentAmount())
                .depositAmount(room.getDepositAmount() != null ? room.getDepositAmount() : (room.getRentAmount() != null ? room.getRentAmount() * 2.0 : 0.0))
                .meterNumber(room.getMeterNumber())
                .baselineUnit(room.getBaselineUnit())
                .floorNumber(room.getFloorNumber())
                .status(room.getStatus())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }
}
