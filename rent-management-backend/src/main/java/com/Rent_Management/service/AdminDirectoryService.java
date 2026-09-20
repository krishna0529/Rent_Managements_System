package com.Rent_Management.service;

import com.Rent_Management.dto.AdminCreateRequest;
import com.Rent_Management.dto.AdminProfileResponse;
import com.Rent_Management.dto.AdminUpdateRequest;

import java.util.List;

public interface AdminDirectoryService {

    List<AdminProfileResponse> getAllAdmins();

    AdminProfileResponse getAdminById(Long id);

    AdminProfileResponse createAdmin(AdminCreateRequest request, String performedBy);

    AdminProfileResponse updateAdmin(Long id, AdminUpdateRequest request, String performedBy);

    void deleteAdmin(Long id, String performedBy);

    void purgeDefaultPrimaryAdmin(String performedBy);
}
