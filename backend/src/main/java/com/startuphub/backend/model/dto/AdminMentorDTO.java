package com.startuphub.backend.model.dto;

import com.startuphub.backend.model.MentorProfile;
import com.startuphub.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMentorDTO {
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
    
    // Mentor specific fields
    private MentorProfile mentorProfile;
    
    public static AdminMentorDTO fromUser(User user) {
        return AdminMentorDTO.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .walletAddress(user.getWalletAddress())
                .publicKey(user.getPublicKey())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .mentorProfile(user.getMentorProfile())
                .build();
    }
}