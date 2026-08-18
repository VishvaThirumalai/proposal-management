package com.startuphub.backend.model.dto;

import com.startuphub.backend.model.InvestorProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminInvestorDTO {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String status;
    private String walletAddress;
    private String publicKey;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Investor specific fields
    private InvestorProfile investorProfile;
}