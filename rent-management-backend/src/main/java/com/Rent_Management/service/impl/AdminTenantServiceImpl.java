package com.Rent_Management.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.Rent_Management.dto.TenantApprovalResponse;
import com.Rent_Management.dto.TenantRejectRequest;
import com.Rent_Management.entity.ElectricityBill;
import com.Rent_Management.entity.Payment;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import com.Rent_Management.entity.UserStatus;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.ElectricityBillRepository;
import com.Rent_Management.repository.PaymentRepository;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.repository.UserRepository;
import com.Rent_Management.service.AdminTenantService;
import com.Rent_Management.service.AuditLogService;
import com.Rent_Management.service.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminTenantServiceImpl implements AdminTenantService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final PaymentRepository paymentRepository;
    private final ElectricityBillRepository electricityBillRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    private TenantApprovalResponse mapToResponse(User user) {
        Optional<Room> roomOpt = roomRepository.findByAssignedUser(user);

        TenantApprovalResponse.TenantApprovalResponseBuilder builder = TenantApprovalResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .fullAddress(user.getFullAddress())
                .aadhaarNumber(user.getAadhaarNumber())
                .aadhaarDocumentPath(user.getAadhaarDocumentPath())
                .profileImagePath(user.getProfileImagePath())
                .dateOfJoining(user.getDateOfJoining())
                .nextDueDate(user.getNextDueDate() != null ? user.getNextDueDate() : (user.getDateOfJoining() != null ? user.getDateOfJoining().plusDays(30) : null))
                .status(user.getStatus() != null ? user.getStatus() : (user.isActive() ? UserStatus.APPROVED : UserStatus.PENDING))
                .isActive(user.isActive())
                .approvedAt(user.getApprovedAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt());

        if (roomOpt.isPresent()) {
            Room r = roomOpt.get();
            builder.roomId(r.getId())
                    .roomUnit(r.getRoomId())
                    .propertyType(r.getPropertyType())
                    .monthlyRent(r.getRentAmount())
                    .depositAmount(r.getDepositAmount() != null ? r.getDepositAmount() : (r.getRentAmount() != null ? r.getRentAmount() * 2.0 : 0.0))
                    .meterNumber(r.getMeterNumber())
                    .baselineUnit(r.getBaselineUnit())
                    .floorNumber(r.getFloorNumber());
        }

        return builder.build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantApprovalResponse> getPendingTenants() {
        return userRepository.findByStatusOrderByCreatedAtDesc(UserStatus.PENDING)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantApprovalResponse> getAllTenants(String statusFilter) {
        List<User> users;
        if (statusFilter != null && !statusFilter.isBlank()) {
            try {
                UserStatus status = UserStatus.valueOf(statusFilter.trim().toUpperCase());
                users = userRepository.findByStatusOrderByCreatedAtDesc(status);
            } catch (IllegalArgumentException e) {
                users = userRepository.findAllByOrderByCreatedAtDesc();
            }
        } else {
            users = userRepository.findAllByOrderByCreatedAtDesc();
        }

        return users.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TenantApprovalResponse getTenantById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant filing not found with ID: " + id));
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public TenantApprovalResponse approveTenant(Long id) {
        return approveTenant(id, null, null);
    }

    @Override
    @Transactional
    public TenantApprovalResponse approveTenant(Long id, Long roomId) {
        return approveTenant(id, roomId, null);
    }

    @Override
    @Transactional
    public TenantApprovalResponse approveTenant(Long id, Long roomId, Double depositAmount) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant filing not found with ID: " + id));

        user.setStatus(UserStatus.APPROVED);
        user.setActive(true);
        user.setApprovedAt(LocalDateTime.now());
        if (user.getNextDueDate() == null) {
            user.setNextDueDate(user.getDateOfJoining() != null ? user.getDateOfJoining().plusDays(30) : LocalDate.now().plusDays(30));
        }

        User savedUser = userRepository.save(user);

        // Room assignment reconciliation
        Room assignedRoom = null;
        if (roomId != null) {
            Optional<Room> specifiedRoomOpt = roomRepository.findById(roomId);
            if (specifiedRoomOpt.isPresent()) {
                Room r = specifiedRoomOpt.get();
                r.setAssignedUser(savedUser);
                r.setStatus("OCCUPIED");
                if (depositAmount != null && depositAmount >= 0) {
                    r.setDepositAmount(depositAmount);
                }
                assignedRoom = roomRepository.save(r);
                log.info("[TENANT APPROVED] Bound room '{}' (ID: {}) with custom deposit ₹{} to tenant '{}'",
                        r.getRoomId(), r.getId(), r.getDepositAmount(), savedUser.getFullName());
            }
        }
        if (assignedRoom == null) {
            Optional<Room> existingRoomOpt = roomRepository.findByAssignedUser(savedUser);
            if (existingRoomOpt.isPresent()) {
                Room r = existingRoomOpt.get();
                r.setStatus("OCCUPIED");
                if (depositAmount != null && depositAmount >= 0) {
                    r.setDepositAmount(depositAmount);
                }
                assignedRoom = roomRepository.save(r);
            }
        }

        String roomName = assignedRoom != null ? assignedRoom.getRoomId() : "Allocated Room";
        log.info("[TENANT APPROVED] Admin approved tenant ID: '{}', Name: '{}', Email: '{}', Room: '{}', Deposit: '{}'",
                savedUser.getId(), savedUser.getFullName(), savedUser.getEmail(), roomName,
                assignedRoom != null ? assignedRoom.getDepositAmount() : "N/A");

        // Record Security Deposit CASH payment in payment history
        Double effectiveDeposit = (depositAmount != null && depositAmount >= 0)
                ? depositAmount
                : (assignedRoom != null && assignedRoom.getDepositAmount() != null
                    ? assignedRoom.getDepositAmount()
                    : (assignedRoom != null && assignedRoom.getRentAmount() != null ? assignedRoom.getRentAmount() * 2.0 : 0.0));

        if (assignedRoom != null && effectiveDeposit > 0) {
            List<Payment> existingDeposits = paymentRepository.findByUserAndBillingMonth(savedUser, "Security Deposit");
            Payment depositPayment;
            if (!existingDeposits.isEmpty()) {
                depositPayment = existingDeposits.get(0);
                depositPayment.setRoom(assignedRoom);
                depositPayment.setRentAmount(effectiveDeposit);
                depositPayment.setElectricityAmount(0.0);
                depositPayment.setTotalAmount(effectiveDeposit);
                depositPayment.setAmountPaid(effectiveDeposit);
                depositPayment.setPendingAmount(0.0);
                depositPayment.setPaymentStatus("PAID");
                depositPayment.setPaymentMode("CASH");
                if (depositPayment.getPaymentDate() == null) {
                    depositPayment.setPaymentDate(LocalDateTime.now());
                }
            } else {
                depositPayment = Payment.builder()
                        .user(savedUser)
                        .room(assignedRoom)
                        .electricityBill(null)
                        .billingMonth("Security Deposit")
                        .rentAmount(effectiveDeposit)
                        .electricityAmount(0.0)
                        .totalAmount(effectiveDeposit)
                        .amountPaid(effectiveDeposit)
                        .pendingAmount(0.0)
                        .paymentStatus("PAID")
                        .paymentMode("CASH")
                        .transactionReference("CASH-DEP-" + savedUser.getId() + "-" + System.currentTimeMillis())
                        .paymentDate(LocalDateTime.now())
                        .build();
            }
            Payment savedPayment = paymentRepository.save(depositPayment);
            log.info("[SECURITY DEPOSIT - CASH] Recorded ₹{} cash deposit payment #PAY-{} for tenant '{}' ({})",
                    effectiveDeposit, savedPayment.getId(), savedUser.getFullName(), savedUser.getEmail());

            auditLogService.log(
                    "SECURITY_DEPOSIT_COLLECTED",
                    "ADMIN",
                    "Payment",
                    String.valueOf(savedPayment.getId()),
                    "Collected Security Deposit in CASH: ₹" + effectiveDeposit + " from tenant " + savedUser.getFullName() + " for Unit " + assignedRoom.getRoomId(),
                    null
            );
        }

        // Dispatch notification email with actual assigned room
        try {
            emailService.sendTenantApprovalNotification(savedUser.getEmail(), savedUser.getFullName(), roomName);
        } catch (Exception e) {
            log.error("[TENANT APPROVED] Failed to send approval email: {}", e.getMessage());
        }

        return mapToResponse(savedUser);
    }

    @Override
    @Transactional
    public TenantApprovalResponse rejectTenant(Long id, TenantRejectRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant filing not found with ID: " + id));

        String userEmail = user.getEmail();
        String userName = user.getFullName();
        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason()
                : "Application rejected by property administration.";

        // 1. Prepare response DTO before deleting user
        TenantApprovalResponse response = mapToResponse(user);
        response.setStatus(UserStatus.REJECTED);
        response.setRejectionReason(reason);

        // 2. Dispatch formal rejection notification email before record is purged
        try {
            emailService.sendTenantRejectionNotification(userEmail, userName, reason);
        } catch (Exception e) {
            log.error("[TENANT REJECTED] Failed to dispatch rejection email: {}", e.getMessage());
        }

        // 3. Find any room assigned to this user, unlink user, and set status to VACANT
        Optional<Room> roomOpt = roomRepository.findByAssignedUser(user);
        String vacatedRoomCode = null;
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            vacatedRoomCode = room.getRoomId();
            room.setAssignedUser(null);
            room.setStatus("VACANT");
            roomRepository.save(room);
            log.info("[TENANT REJECTED] Room '{}' unassigned and set to VACANT.", vacatedRoomCode);
        }

        // 4. Delete payments belonging to this user to avoid FK constraints
        List<Payment> userPayments = paymentRepository.findByUserOrderByCreatedAtDesc(user);
        if (!userPayments.isEmpty()) {
            paymentRepository.deleteAll(userPayments);
            log.info("[TENANT REJECTED] Removed {} payment records for user ID '{}'.", userPayments.size(), id);
        }

        // 5. Unlink electricity bills belonging to this user
        List<ElectricityBill> userBills = electricityBillRepository.findByUserOrderByCreatedAtDesc(user);
        for (ElectricityBill bill : userBills) {
            bill.setUser(null);
            electricityBillRepository.save(bill);
        }

        // 6. Log audit event
        auditLogService.log(
                "TENANT_REJECTED_AND_DELETED",
                "Admin",
                "User",
                String.valueOf(id),
                "Rejected tenant applicant " + userName + " (" + userEmail + "). User record deleted from database" +
                        (vacatedRoomCode != null ? " and occupied room " + vacatedRoomCode + " marked VACANT." : "."),
                null
        );

        // 7. Permanently delete the user from database
        userRepository.delete(user);
        log.warn("[TENANT REJECTED] User ID '{}' ({}) permanently deleted from database. Room status reset to VACANT.", id, userEmail);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public long getPendingCount() {
        return userRepository.countByStatus(UserStatus.PENDING);
    }
}
