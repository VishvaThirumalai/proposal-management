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
public class LoginResponse {
    private String token;
    private String refreshToken;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private String status;
    private String walletAddress;  // ✅ Added
    private String message;
}