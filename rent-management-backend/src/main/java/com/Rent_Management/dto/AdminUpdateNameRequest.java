package com.Rent_Management.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateNameRequest {

    @NotBlank(message = "Full legal name cannot be blank")
    private String fullName;
}
