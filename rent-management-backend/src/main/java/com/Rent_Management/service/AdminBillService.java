package com.Rent_Management.service;

import com.Rent_Management.dto.ElectricityBillRequest;
import com.Rent_Management.dto.ElectricityBillResponse;

import java.util.List;

public interface AdminBillService {

    List<ElectricityBillResponse> getAllBills();

    ElectricityBillResponse getBillById(Long id);

    Double getLatestUnitForRoom(Long roomId);

    ElectricityBillResponse createBill(ElectricityBillRequest request, String performedBy);

    ElectricityBillResponse updateBill(Long id, ElectricityBillRequest request, String performedBy);

    void deleteBill(Long id, String performedBy);
}
