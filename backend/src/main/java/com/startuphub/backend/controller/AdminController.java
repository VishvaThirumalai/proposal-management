package com.startuphub.backend.controller;

import com.startuphub.backend.model.User;
import com.startuphub.backend.model.dto.AdminInvestorDTO;
import com.startuphub.backend.model.dto.AdminMentorDTO;
import com.startuphub.backend.model.dto.AdminVerificationRequest;
import com.startuphub.backend.model.enums.AccountStatus;
import com.startuphub.backend.model.enums.Role;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Transactional
public class AdminController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @GetMapping("/pending-mentors")
    public ResponseEntity<?> getPendingMentors() {
        try {
            List<User> users = userRepository.findMentorsWithProfile();
            
            // ✅ Convert to DTO
            List<AdminMentorDTO> dtos = new ArrayList<>();
            for (User user : users) {
                dtos.add(AdminMentorDTO.fromUser(user));
            }
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to load pending mentors: " + e.getMessage());
        }
    }

    @GetMapping("/pending-investors")
    public ResponseEntity<?> getPendingInvestors() {
        try {
            List<User> users = userRepository.findInvestorsWithProfile();
            
            // ✅ Convert to DTO
            List<AdminInvestorDTO> dtos = new ArrayList<>();
            for (User user : users) {
                dtos.add(AdminInvestorDTO.builder()
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
                        .investorProfile(user.getInvestorProfile())
                        .build());
            }
            
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to load pending investors: " + e.getMessage());
        }
    }

    @PutMapping("/verify-user")
    public ResponseEntity<?> verifyUser(@RequestBody AdminVerificationRequest request) {
        try {
            String response = authService.verifyUser(
                    request.getUserId(),
                    request.isApprove(),
                    request.getReason()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to verify user: " + e.getMessage());
        }
    }

    @GetMapping("/all-users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userRepository.findAllUsersWithProfiles();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to load users: " + e.getMessage());
        }
    }
}