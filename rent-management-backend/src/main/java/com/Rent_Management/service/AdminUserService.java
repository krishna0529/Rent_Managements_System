package com.Rent_Management.service;

import com.Rent_Management.dto.UserSummaryResponse;
import com.Rent_Management.dto.UserUpdateRequest;

import java.util.List;

public interface AdminUserService {

    List<UserSummaryResponse> getAllUsers();

    UserSummaryResponse getUserById(Long id);

    UserSummaryResponse updateUser(Long id, UserUpdateRequest request, String performedBy);

    void deleteUser(Long id, String performedBy);

    List<UserSummaryResponse> getUsersWithDocuments();
}
