package com.Rent_Management.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDropdownResponse {

    private Long id;
    private String fullName;
    private String username;
    private String mobileNumber;
    private String aadhaarNumber;
    private String email;
    private String status;
    private boolean active;
}
