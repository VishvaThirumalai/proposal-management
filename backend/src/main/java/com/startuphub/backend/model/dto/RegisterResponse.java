package com.startuphub.backend.model.dto;

import com.startuphub.backend.model.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterResponse {
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private String status;
    private String walletAddress;
    private String publicKey;      // ✅ NEW
    private String privateKey;     // ✅ NEW (for immediate download)
    private String message;
    private String token;          // For founders (auto-approved)
    private String refreshToken;   // For founders (auto-approved)
}