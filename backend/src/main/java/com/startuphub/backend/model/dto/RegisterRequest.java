package com.startuphub.backend.model.dto;

import com.startuphub.backend.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 50, message = "Password must be between 6 and 50 characters")
    private String password;

    private String phone;

    @NotNull(message = "Role is required")
    private Role role;

    // Mentor fields
    private String company;
    private String designation;
    private Integer yearsExperience;
    private String expertise;
    private String linkedin;

    // Investor fields
    private String organization;
    private String website;
    private String investmentDomains;
    private String investmentStage;
}