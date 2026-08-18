package com.startuphub.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.startuphub.backend.model.enums.StartupStage;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "startups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Startup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "startup_id")
    private Long startupId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "founder_id", nullable = false)
    private User founder;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 100)
    private String domain;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StartupStage stage;

    @Column(name = "funding_amount")
    private Double fundingAmount;

    @Column(columnDefinition = "TEXT")
    private String description;

    // ===== AI Generated Metadata =====
    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "ai_keywords", columnDefinition = "TEXT")
    private String aiKeywords;

    @Column(name = "ai_tags", columnDefinition = "TEXT")
    private String aiTags;

    @Column(name = "ai_technology_stack", columnDefinition = "TEXT")
    private String aiTechnologyStack;

    @Column(name = "ai_mentor_requirements", columnDefinition = "TEXT")
    private String aiMentorRequirements;

    @Column(name = "ai_investor_pitch", columnDefinition = "TEXT")
    private String aiInvestorPitch;

    @Column(name = "ai_problem_statement", columnDefinition = "TEXT")
    private String aiProblemStatement;

    @Column(name = "ai_solution", columnDefinition = "TEXT")
    private String aiSolution;

    @Column(name = "ai_business_model", columnDefinition = "TEXT")
    private String aiBusinessModel;

    // ===== Blockchain Data =====
    @Column(name = "ipfs_cid")
    private String ipfsCid;

    @Column(name = "sha256_hash")
    private String sha256Hash;

    @Column(name = "t_meta")
    private String tMeta;

    @Column(name = "blockchain_tx_hash")
    private String blockchainTxHash;

    @Column(name = "encrypted_aes_key", columnDefinition = "TEXT")
    private String encryptedAesKey;  // ✅ Encrypted AES key (with Founder's Public Key)

    @Builder.Default
    @Column(name = "version")
    private Integer version = 1;

    @Builder.Default
    @Column(name = "status")
    private String status = "PROCESSING";

    @Column(name = "embedding", columnDefinition = "JSON")
    private String embedding;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProposalVersion> versions;

    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Request> requests;

    @OneToMany(mappedBy = "startup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AccessLog> accessLogs;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (version == null) version = 1;
        if (status == null) status = "PROCESSING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}