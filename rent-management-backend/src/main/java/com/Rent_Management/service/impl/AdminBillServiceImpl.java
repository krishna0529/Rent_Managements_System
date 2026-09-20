package com.Rent_Management.service.impl;

import com.Rent_Management.dto.ElectricityBillRequest;
import com.Rent_Management.dto.ElectricityBillResponse;
import com.Rent_Management.entity.ElectricityBill;
import com.Rent_Management.entity.Payment;
import com.Rent_Management.entity.Room;
import com.Rent_Management.entity.User;
import com.Rent_Management.exception.BadRequestException;
import com.Rent_Management.exception.ResourceNotFoundException;
import com.Rent_Management.repository.ElectricityBillRepository;
import com.Rent_Management.repository.PaymentRepository;
import com.Rent_Management.repository.RoomRepository;
import com.Rent_Management.repository.UserRepository;
import com.Rent_Management.service.AdminBillService;
import com.Rent_Management.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminBillServiceImpl implements AdminBillService {

    private final ElectricityBillRepository billRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<ElectricityBillResponse> getAllBills() {
        return billRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ElectricityBillResponse getBillById(Long id) {
        ElectricityBill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Electricity bill not found with ID: " + id));
        return mapToResponse(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public Double getLatestUnitForRoom(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + roomId));

        Optional<ElectricityBill> latestBill = billRepository.findTopByRoomOrderByCreatedAtDesc(room);
        if (latestBill.isPresent()) {
            return latestBill.get().getCurrentUnit();
        }
        return room.getBaselineUnit() != null ? room.getBaselineUnit() : 0.0;
    }

    @Override
    @Transactional
    public ElectricityBillResponse createBill(ElectricityBillRequest request, String performedBy) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + request.getRoomId()));

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));
        } else {
            user = room.getAssignedUser();
        }

        if (request.getCurrentUnit() < request.getPreviousUnit()) {
            throw new BadRequestException("Current unit reading (" + request.getCurrentUnit() + ") cannot be less than previous reading (" + request.getPreviousUnit() + ")");
        }

        double unitsConsumed = request.getCurrentUnit() - request.getPreviousUnit();
        double rate = (request.getRatePerUnit() != null && request.getRatePerUnit() > 0) ? request.getRatePerUnit() : 6.0;
        double totalAmount = unitsConsumed * rate;

        ElectricityBill bill = ElectricityBill.builder()
                .room(room)
                .user(user)
                .billingMonth(request.getBillingMonth().trim())
                .previousUnit(request.getPreviousUnit())
                .currentUnit(request.getCurrentUnit())
                .unitsConsumed(unitsConsumed)
                .ratePerUnit(rate)
                .totalAmount(totalAmount)
                .status("PENDING")
                .billDate(request.getBillDate() != null ? request.getBillDate() : LocalDate.now())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(10))
                .build();

        ElectricityBill saved = billRepository.save(bill);

        // Advance the room's baseline unit to current reading
        room.setBaselineUnit(request.getCurrentUnit());
        roomRepository.save(room);

        // Automatically create or update Payment record if occupant exists
        if (user != null) {
            Payment payment = Payment.builder()
                    .user(user)
                    .room(room)
                    .electricityBill(saved)
                    .billingMonth(request.getBillingMonth().trim())
                    .rentAmount(room.getRentAmount() != null ? room.getRentAmount() : 0.0)
                    .electricityAmount(totalAmount)
                    .totalAmount((room.getRentAmount() != null ? room.getRentAmount() : 0.0) + totalAmount)
                    .amountPaid(0.0)
                    .pendingAmount((room.getRentAmount() != null ? room.getRentAmount() : 0.0) + totalAmount)
                    .paymentStatus("PENDING")
                    .build();
            paymentRepository.save(payment);
        }

        auditLogService.log(
                "BILL_GENERATED",
                performedBy,
                "ElectricityBill",
                String.valueOf(saved.getId()),
                "Generated power bill for room " + room.getRoomId() + " (" + unitsConsumed + " kWh @ ₹" + rate + " = ₹" + totalAmount + ") for " + saved.getBillingMonth(),
                null
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ElectricityBillResponse updateBill(Long id, ElectricityBillRequest request, String performedBy) {
        ElectricityBill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Electricity bill not found with ID: " + id));

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + request.getRoomId()));

        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.getUserId()));
        } else {
            user = room.getAssignedUser();
        }

        if (request.getCurrentUnit() < request.getPreviousUnit()) {
            throw new BadRequestException("Current unit reading (" + request.getCurrentUnit() + ") cannot be less than previous reading (" + request.getPreviousUnit() + ")");
        }

        double unitsConsumed = request.getCurrentUnit() - request.getPreviousUnit();
        double rate = (request.getRatePerUnit() != null && request.getRatePerUnit() > 0) ? request.getRatePerUnit() : 6.0;
        double totalAmount = unitsConsumed * rate;

        bill.setRoom(room);
        bill.setUser(user);
        bill.setBillingMonth(request.getBillingMonth().trim());
        bill.setPreviousUnit(request.getPreviousUnit());
        bill.setCurrentUnit(request.getCurrentUnit());
        bill.setUnitsConsumed(unitsConsumed);
        bill.setRatePerUnit(rate);
        bill.setTotalAmount(totalAmount);
        if (request.getBillDate() != null) bill.setBillDate(request.getBillDate());
        if (request.getDueDate() != null) bill.setDueDate(request.getDueDate());

        ElectricityBill updated = billRepository.save(bill);

        // Synchronize linked pending Payment amount with the updated electricity total
        paymentRepository.findByElectricityBill(updated).ifPresent(p -> {
            p.setElectricityAmount(totalAmount);
            double rent = p.getRentAmount() != null ? p.getRentAmount() : 0.0;
            p.setTotalAmount(rent + totalAmount);
            if (!"PAID".equals(p.getPaymentStatus())) {
                double paid = p.getAmountPaid() != null ? p.getAmountPaid() : 0.0;
                p.setPendingAmount(Math.max(0.0, (rent + totalAmount) - paid));
            }
            paymentRepository.save(p);
        });

        auditLogService.log(
                "BILL_UPDATED",
                performedBy,
                "ElectricityBill",
                String.valueOf(updated.getId()),
                "Updated electricity bill #" + updated.getId() + " for room " + room.getRoomId() + " (Total ₹" + totalAmount + " @ ₹" + rate + "/unit)",
                null
        );

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteBill(Long id, String performedBy) {
        ElectricityBill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Electricity bill not found with ID: " + id));

        String info = "Bill #" + id + " for room " + bill.getRoom().getRoomId() + " (" + bill.getBillingMonth() + ")";

        // Unlink or clean linked payment before deleting bill
        paymentRepository.findByElectricityBill(bill).ifPresent(p -> {
            if ("PENDING".equals(p.getPaymentStatus())) {
                paymentRepository.delete(p);
            } else {
                p.setElectricityBill(null);
                paymentRepository.save(p);
            }
        });

        billRepository.delete(bill);

        auditLogService.log(
                "BILL_DELETED",
                performedBy,
                "ElectricityBill",
                String.valueOf(id),
                "Deleted electricity bill: " + info,
                null
        );
    }

    private ElectricityBillResponse mapToResponse(ElectricityBill b) {
        Room r = b.getRoom();
        User u = b.getUser();
        return ElectricityBillResponse.builder()
                .id(b.getId())
                .roomId(r != null ? r.getId() : null)
                .roomCode(r != null ? r.getRoomId() : "N/A")
                .propertyType(r != null ? r.getPropertyType() : "N/A")
                .userId(u != null ? u.getId() : null)
                .userName(u != null ? u.getFullName() : (r != null && r.getAssignedUser() != null ? r.getAssignedUser().getFullName() : "Unassigned"))
                .userMobile(u != null ? u.getMobileNumber() : (r != null && r.getAssignedUser() != null ? r.getAssignedUser().getMobileNumber() : "N/A"))
                .billingMonth(b.getBillingMonth())
                .previousUnit(b.getPreviousUnit())
                .currentUnit(b.getCurrentUnit())
                .unitsConsumed(b.getUnitsConsumed())
                .ratePerUnit(b.getRatePerUnit())
                .totalAmount(b.getTotalAmount())
                .status(b.getStatus())
                .billDate(b.getBillDate())
                .dueDate(b.getDueDate())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
