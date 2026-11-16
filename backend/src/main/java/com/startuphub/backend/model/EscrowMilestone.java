package com.startuphub.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "escrow_milestones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscrowMilestone {

    @Id
    @Column(name = "milestone_id")
    private String milestoneId;

    @Column(name = "escrow_id", nullable = false)
    private String escrowId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double amount;

    @Column(name = "due_date")
    private String dueDate;

    @Column(nullable = false)
    private String status;

    @Column(name = "proof_cid")
    private String proofCid;

    @Column(name = "proof_hash")
    private String proofHash;

    @Column(name = "proof_notes", columnDefinition = "TEXT")
    private String proofNotes;

    @Column(name = "submitted_by")
    private String submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @Column(columnDefinition = "TEXT")
    private String approvals;

    @Column(columnDefinition = "TEXT")
    private String rejections;

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
        if (status == null) status = "PENDING";
        if (approvals == null) approvals = "[]";
        if (rejections == null) rejections = "[]";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}