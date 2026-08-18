package com.startuphub.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "investor_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvestorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "investor_id")
    private Long investorId;

    @JsonIgnore  // ✅ Prevents recursion
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "organization", length = 200)
    private String organization;

    @Column(length = 200)
    private String website;

    @Column(name = "investment_domains", columnDefinition = "TEXT")
    private String investmentDomains;

    @Column(name = "investment_stage", columnDefinition = "TEXT")
    private String investmentStage;

    @Column(length = 500)
    private String linkedin;

    @Column(name = "verification_status")
    private String verificationStatus;

    @Column(name = "embedding", columnDefinition = "JSON")
    private String embedding;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (verificationStatus == null) verificationStatus = "PENDING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}