package com.startuphub.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "escrows")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Escrow {

    @Id
    @Column(name = "escrow_id")
    private String escrowId;

    @Column(name = "startup_id", nullable = false)
    private Long startupId;

    @Column(name = "investor_id", nullable = false)
    private Long investorId;

    @Column(name = "founder_id", nullable = false)
    private Long founderId;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount;

    @Column(name = "released_amount")
    private Double releasedAmount = 0.0;

    @Column(name = "required_approvals")
    private Integer requiredApprovals;

    @Column(name = "approvers", columnDefinition = "TEXT")
    private String approvers;

    @Column(name = "status")
    private String status;

    @Column(name = "blockchain_tx_hash")
    private String blockchainTxHash;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (releasedAmount == null) releasedAmount = 0.0;
        if (status == null) status = "ACTIVE";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}