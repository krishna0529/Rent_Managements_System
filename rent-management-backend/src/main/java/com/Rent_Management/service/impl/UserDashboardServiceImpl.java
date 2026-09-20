package com.Rent_Management.service.impl;

import com.Rent_Management.dto.UserDashboardResponse;
import com.Rent_Management.dto.UserPaymentRequest;
import com.Rent_Management.dto.UserProfileResponse;
import com.Rent_Management.entity.ElectricityBill;
import com.Rent_Management.entity.Payment;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import com.Rent_Management.exception.BadRequestException;
import com.Rent_Management.exception.InvalidCredentialsException;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.ElectricityBillRepository;
import com.Rent_Management.repository.PaymentRepository;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.repository.UserRepository;
import com.Rent_Management.security.JwtTokenProvider;
import com.Rent_Management.service.AuditLogService;
import com.Rent_Management.service.UserDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDashboardServiceImpl implements UserDashboardService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final ElectricityBillRepository electricityBillRepository;
    private final PaymentRepository paymentRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;

    private User resolveUserFromToken(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Authorization token is required to access resident dashboard telemetry");
        }
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
        if (!jwtTokenProvider.validateToken(cleanToken)) {
            throw new InvalidCredentialsException("Invalid or expired session token");
        }
        String username = jwtTokenProvider.getUsernameFromToken(cleanToken);
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new InvalidCredentialsException("User account has been deleted or removed from database"));
        if (!user.isActive()) {
            throw new InvalidCredentialsException("User account has been deactivated or removed by administrator");
        }
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public void validateActiveUser(String token) {
        resolveUserFromToken(token);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDashboardResponse getDashboardData(String token) {
        User user = resolveUserFromToken(token);

        // Ensure nextDueDate is populated from database or initialized to dateOfJoining + 30 days
        if (user.getNextDueDate() == null) {
            if (user.getDateOfJoining() != null) {
                user.setNextDueDate(user.getDateOfJoining().plusDays(30));
            } else {
                user.setNextDueDate(LocalDate.now().plusDays(30));
            }
            user = userRepository.save(user);
        }

        LocalDate userNextDueDate = user.getNextDueDate();

        UserProfileResponse userProfile = UserProfileResponse.builder()
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
                .nextDueDate(userNextDueDate)
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .isActive(user.isActive())
                .build();

        Optional<Room> roomOpt = roomRepository.findByAssignedUser(user);
        UserDashboardResponse.RoomInfo roomInfo = null;
        if (roomOpt.isPresent()) {
            Room r = roomOpt.get();
            roomInfo = UserDashboardResponse.RoomInfo.builder()
                    .id(r.getId())
                    .roomId(r.getRoomId())
                    .propertyType(r.getPropertyType())
                    .rentAmount(r.getRentAmount())
                    .meterNumber(r.getMeterNumber())
                    .baselineUnit(r.getBaselineUnit())
                    .floorNumber(r.getFloorNumber())
                    .status(r.getStatus())
                    .securityDeposit(r.getDepositAmount() != null ? r.getDepositAmount() : (r.getRentAmount() != null ? r.getRentAmount() * 2.0 : 0.0))
                    .build();
        }

        Optional<ElectricityBill> latestBillOpt = Optional.empty();
        if (roomOpt.isPresent()) {
            latestBillOpt = electricityBillRepository.findTopByRoomOrderByCreatedAtDesc(roomOpt.get());
        }
        if (latestBillOpt.isEmpty()) {
            List<ElectricityBill> userBills = electricityBillRepository.findByUserOrderByCreatedAtDesc(user);
            if (!userBills.isEmpty()) {
                latestBillOpt = Optional.of(userBills.get(0));
            }
        }

        UserDashboardResponse.BillInfo billInfo = null;
        if (latestBillOpt.isPresent()) {
            ElectricityBill b = latestBillOpt.get();
            billInfo = UserDashboardResponse.BillInfo.builder()
                    .id(b.getId())
                    .billingMonth(b.getBillingMonth())
                    .previousUnit(b.getPreviousUnit())
                    .currentUnit(b.getCurrentUnit())
                    .unitsConsumed(b.getUnitsConsumed())
                    .ratePerUnit(b.getRatePerUnit())
                    .totalAmount(b.getTotalAmount())
                    .status(b.getStatus())
                    .billDate(b.getBillDate())
                    .dueDate(b.getDueDate())
                    .build();
        }

        List<Payment> payments = paymentRepository.findByUserOrderByCreatedAtDesc(user);
        List<UserDashboardResponse.PaymentHistoryItem> paymentHistory = payments.stream()
                .map(p -> UserDashboardResponse.PaymentHistoryItem.builder()
                        .id(p.getId())
                        .invoiceNumber(String.format("INV-%d-%04d", p.getCreatedAt() != null ? p.getCreatedAt().getYear() : 2024, p.getId()))
                        .billingMonth(p.getBillingMonth())
                        .rentAmount(p.getRentAmount())
                        .electricityAmount(p.getElectricityAmount())
                        .totalAmount(p.getTotalAmount())
                        .amountPaid(p.getAmountPaid())
                        .status(p.getPaymentStatus())
                        .paymentMode(p.getPaymentMode())
                        .transactionReference(p.getTransactionReference())
                        .paymentDate(p.getPaymentDate())
                        .createdAt(p.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        Payment pendingPayment = payments.stream()
                .filter(p -> "PENDING".equalsIgnoreCase(p.getPaymentStatus()) || "PARTIAL".equalsIgnoreCase(p.getPaymentStatus()))
                .findFirst()
                .orElse(null);

        UserDashboardResponse.DuesInfo duesInfo;
        if (pendingPayment != null) {
            duesInfo = UserDashboardResponse.DuesInfo.builder()
                    .paymentId(pendingPayment.getId())
                    .billingMonth(pendingPayment.getBillingMonth())
                    .rentAmount(pendingPayment.getRentAmount())
                    .electricityAmount(pendingPayment.getElectricityAmount())
                    .totalAmount(pendingPayment.getTotalAmount())
                    .amountPaid(pendingPayment.getAmountPaid())
                    .pendingAmount(pendingPayment.getPendingAmount())
                    .status(pendingPayment.getPaymentStatus())
                    .dueDate(userNextDueDate)
                    .build();
        } else {
            duesInfo = UserDashboardResponse.DuesInfo.builder()
                    .paymentId(null)
                    .billingMonth(latestBillOpt.map(ElectricityBill::getBillingMonth).orElse("Current"))
                    .rentAmount(roomInfo != null ? roomInfo.getRentAmount() : 0.0)
                    .electricityAmount(billInfo != null ? billInfo.getTotalAmount() : 0.0)
                    .totalAmount(0.0)
                    .amountPaid(0.0)
                    .pendingAmount(0.0)
                    .status("PAID")
                    .dueDate(userNextDueDate)
                    .build();
        }

        String wifiNetwork = "CyberVault-Mesh_5G";
        String wifiPassword = "tenant_" + (roomInfo != null ? roomInfo.getRoomId().toLowerCase().replaceAll("[^a-z0-9]", "") : "secure") + "_2024";

        return UserDashboardResponse.builder()
                .user(userProfile)
                .room(roomInfo)
                .latestBill(billInfo)
                .currentDues(duesInfo)
                .paymentHistory(paymentHistory)
                .wifiNetwork(wifiNetwork)
                .wifiPassword(wifiPassword)
                .build();
    }

    @Override
    @Transactional
    public UserDashboardResponse.PaymentHistoryItem payDues(String token, UserPaymentRequest request, String ipAddress) {
        User user = resolveUserFromToken(token);

        List<Payment> payments = paymentRepository.findByUserOrderByCreatedAtDesc(user);
        Payment pendingPayment = payments.stream()
                .filter(p -> "PENDING".equalsIgnoreCase(p.getPaymentStatus()) || "PARTIAL".equalsIgnoreCase(p.getPaymentStatus()))
                .findFirst()
                .orElse(null);

        if (pendingPayment == null) {
            throw new BadRequestException("No pending dues found to pay for your account.");
        }

        Double payAmount = request.getAmount();
        if (payAmount <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero.");
        }
        if (payAmount > pendingPayment.getPendingAmount() + 0.01) {
            throw new BadRequestException("Payment amount ₹" + payAmount + " exceeds outstanding dues ₹" + pendingPayment.getPendingAmount());
        }

        pendingPayment.setAmountPaid(pendingPayment.getAmountPaid() + payAmount);
        pendingPayment.setPaymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "ONLINE_UPI");
        pendingPayment.setTransactionReference(request.getTransactionReference() != null ? request.getTransactionReference() : "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        pendingPayment.setPaymentDate(LocalDateTime.now());

        pendingPayment.setPendingAmount(Math.max(0.0, pendingPayment.getTotalAmount() - pendingPayment.getAmountPaid()));
        if (pendingPayment.getPendingAmount() <= 0.0) {
            pendingPayment.setPaymentStatus("PAID");
            if (pendingPayment.getElectricityBill() != null) {
                ElectricityBill bill = pendingPayment.getElectricityBill();
                bill.setStatus("PAID");
                electricityBillRepository.save(bill);
            }
            // Advance nextDueDate by 30 days in database upon rent payment settlement
            LocalDate currentDue = user.getNextDueDate() != null
                    ? user.getNextDueDate()
                    : (user.getDateOfJoining() != null ? user.getDateOfJoining().plusDays(30) : LocalDate.now().plusDays(30));
            user.setNextDueDate(currentDue.plusDays(30));
            userRepository.save(user);
        } else {
            pendingPayment.setPaymentStatus("PARTIAL");
        }

        Payment saved = paymentRepository.save(pendingPayment);

        auditLogService.log(
                "TENANT_ONLINE_PAYMENT",
                user.getUsername(),
                "Payment",
                saved.getId().toString(),
                "Tenant paid ₹" + payAmount + " via " + saved.getPaymentMode() + " (Ref: " + saved.getTransactionReference() + ")",
                ipAddress != null ? ipAddress : "127.0.0.1"
        );

        return UserDashboardResponse.PaymentHistoryItem.builder()
                .id(saved.getId())
                .invoiceNumber(String.format("INV-%d-%04d", saved.getCreatedAt() != null ? saved.getCreatedAt().getYear() : 2024, saved.getId()))
                .billingMonth(saved.getBillingMonth())
                .rentAmount(saved.getRentAmount())
                .electricityAmount(saved.getElectricityAmount())
                .totalAmount(saved.getTotalAmount())
                .amountPaid(saved.getAmountPaid())
                .status(saved.getPaymentStatus())
                .paymentMode(saved.getPaymentMode())
                .transactionReference(saved.getTransactionReference())
                .paymentDate(saved.getPaymentDate())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
