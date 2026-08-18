package com.startuphub.backend.service;

import com.startuphub.backend.config.JwtUtil;
import com.startuphub.backend.model.*;
import com.startuphub.backend.model.dto.*;
import com.startuphub.backend.model.enums.AccountStatus;
import com.startuphub.backend.model.enums.Role;
import com.startuphub.backend.repository.*;
import com.startuphub.backend.util.KeyGeneratorUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.security.KeyPair;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final InvestorProfileRepository investorProfileRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EntityManager entityManager;

    // ===== REGISTER =====
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        try {
            System.out.println("📝 Registering user: " + request.getEmail());
            
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already registered: " + request.getEmail());
            }

            KeyPair keyPair = KeyGeneratorUtil.generateKeyPair();
            String publicKey = KeyGeneratorUtil.encodePublicKey(keyPair.getPublic());
            String privateKey = KeyGeneratorUtil.encodePrivateKey(keyPair.getPrivate());

            AccountStatus status;
            if (request.getRole() == Role.FOUNDER) {
                status = AccountStatus.APPROVED;
            } else {
                status = AccountStatus.PENDING;
            }

            String walletAddress = generateWalletAddress();

            User user = User.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .phone(request.getPhone())
                    .role(request.getRole())
                    .status(status)
                    .publicKey(publicKey)
                    .walletAddress(walletAddress)
                    .build();

            System.out.println("💾 Saving user: " + user.getEmail());
            User savedUser = userRepository.save(user);
            System.out.println("✅ User saved with ID: " + savedUser.getUserId());

            if (request.getRole() == Role.MENTOR) {
                MentorProfile profile = MentorProfile.builder()
                        .user(savedUser)
                        .company(request.getCompany())
                        .designation(request.getDesignation())
                        .yearsExperience(request.getYearsExperience())
                        .expertise(request.getExpertise())
                        .linkedin(request.getLinkedin())
                        .verificationStatus("PENDING")
                        .build();
                mentorProfileRepository.save(profile);
            } else if (request.getRole() == Role.INVESTOR) {
                InvestorProfile profile = InvestorProfile.builder()
                        .user(savedUser)
                        .organization(request.getOrganization())
                        .website(request.getWebsite())
                        .investmentDomains(request.getInvestmentDomains())
                        .investmentStage(request.getInvestmentStage())
                        .linkedin(request.getLinkedin())
                        .verificationStatus("PENDING")
                        .build();
                investorProfileRepository.save(profile);
            }

            RegisterResponse response = RegisterResponse.builder()
                    .userId(savedUser.getUserId())
                    .name(savedUser.getName())
                    .email(savedUser.getEmail())
                    .role(savedUser.getRole())
                    .status(savedUser.getStatus().name())
                    .walletAddress(savedUser.getWalletAddress())
                    .publicKey(publicKey)
                    .privateKey(privateKey)
                    .message("Registration successful. Download your private key file.")
                    .build();

            if (savedUser.getStatus() == AccountStatus.APPROVED) {
                String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getRole().name(), savedUser.getUserId());
                String refreshToken = jwtUtil.generateRefreshToken(savedUser.getEmail());
                response.setToken(token);
                response.setRefreshToken(refreshToken);
                response.setMessage("Registration successful. Download your private key file.");
            } else {
                response.setMessage("Registration successful. Waiting for admin verification. Download your private key file.");
            }

            return response;

        } catch (Exception e) {
            System.err.println("❌ Registration error: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Registration failed: " + e.getMessage());
        }
    }

    // ===== LOGIN =====
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getRole() != request.getRole()) {
            throw new RuntimeException("Invalid role selected");
        }

        if (user.getStatus() == AccountStatus.PENDING) {
            throw new RuntimeException("Account pending admin verification");
        }
        if (user.getStatus() == AccountStatus.REJECTED) {
            throw new RuntimeException("Account rejected by admin");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        if (authentication.isAuthenticated()) {
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getUserId());
            String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

            return LoginResponse.builder()
                    .token(token)
                    .refreshToken(refreshToken)
                    .userId(user.getUserId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .status(user.getStatus().name())
                    .walletAddress(user.getWalletAddress())
                    .message("Login successful")
                    .build();
        }

        throw new RuntimeException("Invalid credentials");
    }

    // ===== ADMIN VERIFICATION =====
    @Transactional
    public String verifyUser(Long userId, boolean approve, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.FOUNDER || user.getRole() == Role.ADMIN) {
            throw new RuntimeException("Cannot verify founders or admins");
        }

        if (approve) {
            user.setStatus(AccountStatus.APPROVED);
            if (user.getRole() == Role.MENTOR) {
                MentorProfile profile = mentorProfileRepository.findByUser(user)
                        .orElseThrow(() -> new RuntimeException("Mentor profile not found"));
                profile.setVerificationStatus("APPROVED");
                mentorProfileRepository.save(profile);
            } else if (user.getRole() == Role.INVESTOR) {
                InvestorProfile profile = investorProfileRepository.findByUser(user)
                        .orElseThrow(() -> new RuntimeException("Investor profile not found"));
                profile.setVerificationStatus("APPROVED");
                investorProfileRepository.save(profile);
            }
            userRepository.save(user);
            return "User approved successfully";
        } else {
            user.setStatus(AccountStatus.REJECTED);
            userRepository.save(user);
            return "User rejected successfully";
        }
    }

    // ===== CHANGE PASSWORD (User logged in) =====
    @Transactional
    public String changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify old password
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return "Password changed successfully";
    }

    // ===== ADMIN RESET PASSWORD (Admin only) =====
    @Transactional
    public String adminResetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return "Password reset successfully by admin";
    }

    // ===== FORGOT PASSWORD - Generates token and returns it (No email) =====
    @Transactional
    public String requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Delete any existing token
        entityManager.createQuery(
            "DELETE FROM PasswordResetToken prt WHERE prt.user.userId = :userId")
            .setParameter("userId", user.getUserId())
            .executeUpdate();

        // Generate new token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .build();
        passwordResetTokenRepository.save(resetToken);

        // ✅ Return the token directly (for in-app reset)
        return token;
    }

    // ===== RESET PASSWORD WITH TOKEN =====
    @Transactional
    public String resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        passwordResetTokenRepository.deleteByToken(token);
        
        return "Password reset successfully";
    }

    // ===== FORGOT PASSWORD - Returns token in response (frontend handles) =====
    @Transactional
    public ForgotPasswordResponse forgotPassword(String email) {
        String token = requestPasswordReset(email);
        return ForgotPasswordResponse.builder()
                .message("Reset token generated successfully")
                .resetToken(token)
                .expiryHours(24)
                .build();
    }

    // ===== HELPER METHODS =====
    
    private String generateWalletAddress() {
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 40; i++) {
            sb.append(Integer.toHexString(random.nextInt(16)));
        }
        return "0x" + sb.toString();
    }
}