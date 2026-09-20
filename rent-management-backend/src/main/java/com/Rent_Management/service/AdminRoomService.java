package com.Rent_Management.service;

import com.Rent_Management.dto.RoomRequest;
import com.Rent_Management.dto.RoomResponse;
import com.Rent_Management.dto.UserDropdownResponse;

import java.util.List;

public interface AdminRoomService {

    List<RoomResponse> getAllRooms();

    RoomResponse getRoomById(Long id);

    RoomResponse createRoom(RoomRequest request, String performedBy);

    RoomResponse updateRoom(Long id, RoomRequest request, String performedBy);

    void deleteRoom(Long id, String performedBy);

    List<UserDropdownResponse> getAvailableUsers();
}
