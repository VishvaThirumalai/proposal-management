package com.startuphub.backend.model;

import com.startuphub.backend.model.Startup;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "proposal_versions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "version_id")
    private Long versionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "startup_id", nullable = false)
    private Startup startup;

    @Column(name = "version_number")
    private Integer versionNumber;

    @Column(name = "ipfs_cid")
    private String ipfsCid;

    @Column(name = "sha256_hash")
    private String sha256Hash;

    @Column(name = "t_meta")
    private String tMeta;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "ai_keywords", columnDefinition = "TEXT")
    private String aiKeywords;

    @Column(name = "status")
    private String status; // ACTIVE, ARCHIVED

    @Column(name = "blockchain_tx_hash")
    private String blockchainTxHash;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }
}