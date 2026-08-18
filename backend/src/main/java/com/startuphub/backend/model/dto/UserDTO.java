package com.startuphub.backend.model.dto;

import com.startuphub.backend.model.enums.AccountStatus;
import com.startuphub.backend.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private AccountStatus status;
    private String walletAddress;
    private String publicKey;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // For mentors
    private String company;
    private String designation;
    private Integer yearsExperience;
    private String expertise;
    private String linkedin;
    private String verificationStatus;
    
    // For investors
    private String organization;
    private String website;
    private String investmentDomains;
    private String investmentStage;
}