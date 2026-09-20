package com.Rent_Management.service.impl;

import com.Rent_Management.dto.PaymentRecordRequest;
import com.Rent_Management.dto.PaymentResponse;
import com.Rent_Management.entity.ElectricityBill;
import com.Rent_Management.entity.Payment;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import com.Rent_Management.exception.BadRequestException;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.ElectricityBillRepository;
import com.Rent_Management.repository.PaymentRepository;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.service.AdminPaymentService;
import com.Rent_Management.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminPaymentServiceImpl implements AdminPaymentService {

    private final PaymentRepository paymentRepository;
    private final ElectricityBillRepository electricityBillRepository;
    private final AuditLogService auditLogService;
    private final RoomRepository roomRepository;
    private final com.Rent_Management.repository.UserRepository userRepository;

    private void syncMissingSecurityDepositPayments() {
        try {
            List<Room> rooms = roomRepository.findAll();
            for (Room r : rooms) {
                User u = r.getAssignedUser();
                if (u != null && u.isActive()) {
                    Double deposit = r.getDepositAmount() != null && r.getDepositAmount() > 0
                            ? r.getDepositAmount()
                            : (r.getRentAmount() != null ? r.getRentAmount() * 2.0 : 0.0);

                    if (deposit > 0) {
                        List<Payment> existing = paymentRepository.findByUserAndBillingMonth(u, "Security Deposit");
                        if (existing.isEmpty()) {
                            Payment depositPayment = Payment.builder()
                                    .user(u)
                                    .room(r)
                                    .electricityBill(null)
                                    .billingMonth("Security Deposit")
                                    .rentAmount(deposit)
                                    .electricityAmount(0.0)
                                    .totalAmount(deposit)
                                    .amountPaid(deposit)
                                    .pendingAmount(0.0)
                                    .paymentStatus("PAID")
                                    .paymentMode("CASH")
                                    .transactionReference("CASH-DEP-" + u.getId() + "-" + System.currentTimeMillis())
                                    .paymentDate(u.getApprovedAt() != null ? u.getApprovedAt() : LocalDateTime.now())
                                    .build();
                            paymentRepository.save(depositPayment);
                            log.info("[SYNC SECURITY DEPOSIT - CASH] Auto-recorded missing deposit ₹{} for active tenant '{}'",
                                    deposit, u.getFullName());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[SYNC SECURITY DEPOSIT] Could not sync deposits: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public List<PaymentResponse> getAllPayments(String status) {
        syncMissingSecurityDepositPayments();
        List<Payment> list;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            list = paymentRepository.findByStatusOrderByLatestActivityDesc(status.toUpperCase());
        } else {
            list = paymentRepository.findAllOrderByLatestActivityDesc();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPendingPayments() {
        return paymentRepository.findPendingPayments()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found with ID: " + id));
        return mapToResponse(payment);
    }

    @Override
    @Transactional
    public PaymentResponse markPaymentAsPaid(Long id, PaymentRecordRequest request, String performedBy) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found with ID: " + id));

        double pay = request.getAmountPaid();
        if (pay <= 0) {
            throw new BadRequestException("Amount paid must be greater than zero");
        }

        payment.setAmountPaid(pay);
        payment.setPendingAmount(Math.max(0.0, payment.getTotalAmount() - pay));
        payment.setPaymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "UPI");
        payment.setTransactionReference(request.getTransactionReference());
        payment.setPaymentDate(LocalDateTime.now());

        if (payment.getPendingAmount() <= 0.0) {
            payment.setPaymentStatus("PAID");
            if (!"Security Deposit".equalsIgnoreCase(payment.getBillingMonth()) && payment.getUser() != null) {
                User u = payment.getUser();
                java.time.LocalDate currentDue = u.getNextDueDate() != null
                        ? u.getNextDueDate()
                        : (u.getDateOfJoining() != null ? u.getDateOfJoining().plusDays(30) : java.time.LocalDate.now().plusDays(30));
                u.setNextDueDate(currentDue.plusDays(30));
                userRepository.save(u);
            }
        } else {
            payment.setPaymentStatus("PARTIAL");
        }

        // If linked to an electricity bill, mark that bill paid as well
        if (payment.getElectricityBill() != null && "PAID".equals(payment.getPaymentStatus())) {
            ElectricityBill bill = payment.getElectricityBill();
            bill.setStatus("PAID");
            electricityBillRepository.save(bill);
        }

        Payment saved = paymentRepository.save(payment);

        auditLogService.log(
                "PAYMENT_SETTLED",
                performedBy,
                "Payment",
                String.valueOf(saved.getId()),
                "Settled payment for tenant " + saved.getUser().getFullName() + " (Room " + saved.getRoom().getRoomId() + "): Received ₹" + pay + " via " + saved.getPaymentMode(),
                null
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void deletePayment(Long id, String performedBy) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment record not found with ID: " + id));

        paymentRepository.delete(payment);

        auditLogService.log(
                "PAYMENT_DELETED",
                performedBy,
                "Payment",
                String.valueOf(id),
                "Deleted payment ledger record #" + id,
                null
        );
    }

    private PaymentResponse mapToResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .userName(p.getUser() != null ? p.getUser().getFullName() : "N/A")
                .userMobile(p.getUser() != null ? p.getUser().getMobileNumber() : "N/A")
                .roomId(p.getRoom() != null ? p.getRoom().getId() : null)
                .roomCode(p.getRoom() != null ? p.getRoom().getRoomId() : "N/A")
                .billingMonth(p.getBillingMonth())
                .rentAmount(p.getRentAmount())
                .electricityAmount(p.getElectricityAmount())
                .totalAmount(p.getTotalAmount())
                .amountPaid(p.getAmountPaid())
                .pendingAmount(p.getPendingAmount())
                .paymentStatus(p.getPaymentStatus())
                .paymentMode(p.getPaymentMode())
                .transactionReference(p.getTransactionReference())
                .paymentDate(p.getPaymentDate())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
