package com.Rent_Management.service.impl;

import com.Rent_Management.dto.UserSummaryResponse;
import com.Rent_Management.dto.UserUpdateRequest;
import com.Rent_Management.entity.ElectricityBill;
import com.Rent_Management.entity.Payment;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import com.Rent_Management.entity.UserStatus;
import com.Rent_Management.exception.BadRequestException;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.ElectricityBillRepository;
import com.Rent_Management.repository.PaymentRepository;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.repository.UserRepository;
import com.Rent_Management.service.AdminUserService;
import com.Rent_Management.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final ElectricityBillRepository electricityBillRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserSummaryResponse updateUser(Long id, UserUpdateRequest request, String performedBy) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        // Check unique fields if changed
        if (!user.getEmail().equalsIgnoreCase(request.getEmail().trim())) {
            if (userRepository.existsByEmail(request.getEmail().trim())) {
                throw new BadRequestException("Email already in use: " + request.getEmail());
            }
            user.setEmail(request.getEmail().trim());
        }

        if (!user.getMobileNumber().equalsIgnoreCase(request.getMobileNumber().trim())) {
            if (userRepository.existsByMobileNumber(request.getMobileNumber().trim())) {
                throw new BadRequestException("Mobile number already in use: " + request.getMobileNumber());
            }
            user.setMobileNumber(request.getMobileNumber().trim());
        }

        if (!user.getAadhaarNumber().equalsIgnoreCase(request.getAadhaarNumber().trim())) {
            if (userRepository.existsByAadhaarNumber(request.getAadhaarNumber().trim())) {
                throw new BadRequestException("Aadhaar number already in use: " + request.getAadhaarNumber());
            }
            user.setAadhaarNumber(request.getAadhaarNumber().trim());
        }

        user.setFullName(request.getFullName().trim());
        user.setFullAddress(request.getFullAddress().trim());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                UserStatus newStatus = UserStatus.valueOf(request.getStatus().trim().toUpperCase());
                if (newStatus == UserStatus.REJECTED) {
                    deleteUser(id, performedBy);
                    user.setStatus(UserStatus.REJECTED);
                    user.setActive(false);
                    return mapToResponse(user);
                }
                user.setStatus(newStatus);
            } catch (Exception ignored) {}
        }

        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        User updated = userRepository.save(user);

        auditLogService.log(
                "USER_UPDATED",
                performedBy,
                "User",
                String.valueOf(updated.getId()),
                "Updated details for user: " + updated.getFullName() + " (Status: " + updated.getStatus() + ")",
                null
        );

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteUser(Long id, String performedBy) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        // 1. If user is assigned to a room, unbind and mark VACANT
        Optional<Room> roomOpt = roomRepository.findByAssignedUser(user);
        String vacatedRoomCode = null;
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            vacatedRoomCode = room.getRoomId();
            room.setAssignedUser(null);
            room.setStatus("VACANT");
            roomRepository.save(room);
            log.info("[USER DELETED] Room '{}' vacated and unassigned from user ID '{}'.", vacatedRoomCode, id);
        }

        // 2. Clear payments belonging to this user
        List<Payment> payments = paymentRepository.findByUserOrderByCreatedAtDesc(user);
        if (!payments.isEmpty()) {
            paymentRepository.deleteAll(payments);
            log.info("[USER DELETED] Cleared {} payment records for user ID '{}'.", payments.size(), id);
        }

        // 3. Unlink electricity bills
        List<ElectricityBill> bills = electricityBillRepository.findByUserOrderByCreatedAtDesc(user);
        for (ElectricityBill bill : bills) {
            bill.setUser(null);
            electricityBillRepository.save(bill);
        }

        String name = user.getFullName();
        userRepository.delete(user);

        auditLogService.log(
                "USER_DELETED",
                performedBy,
                "User",
                String.valueOf(id),
                "Deleted user account: " + name + " (ID: " + id + ")" +
                        (vacatedRoomCode != null ? ". Assigned room " + vacatedRoomCode + " marked VACANT." : "."),
                null
        );
        log.warn("[USER DELETED] User ID '{}' ({}) permanently deleted from database.", id, name);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getUsersWithDocuments() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(u -> (u.getAadhaarNumber() != null && !u.getAadhaarNumber().isBlank())
                        || (u.getAadhaarDocumentPath() != null && !u.getAadhaarDocumentPath().isBlank()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private UserSummaryResponse mapToResponse(User u) {
        Optional<Room> roomOpt = roomRepository.findByAssignedUser(u);
        return UserSummaryResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .username(u.getUsername())
                .email(u.getEmail())
                .mobileNumber(u.getMobileNumber())
                .fullAddress(u.getFullAddress())
                .aadhaarNumber(u.getAadhaarNumber())
                .aadhaarDocumentPath(u.getAadhaarDocumentPath())
                .profileImagePath(u.getProfileImagePath())
                .dateOfJoining(u.getDateOfJoining())
                .nextDueDate(u.getNextDueDate() != null ? u.getNextDueDate() : (u.getDateOfJoining() != null ? u.getDateOfJoining().plusDays(30) : null))
                .role(u.getRole() != null ? u.getRole().name() : "ROLE_USER")
                .status(u.getStatus() != null ? u.getStatus().name() : "PENDING")
                .active(u.isActive())
                .assignedRoomCode(roomOpt.map(Room::getRoomId).orElse(null))
                .assignedRoomId(roomOpt.map(Room::getId).orElse(null))
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
