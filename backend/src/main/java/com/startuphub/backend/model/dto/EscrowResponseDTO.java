package com.startuphub.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscrowResponseDTO {
    private String escrowId;
    private String startupId;
    private String investorId;
    private String founderId;
    private Double totalAmount;
    private Double releasedAmount;
    private String status;
    private Integer requiredApprovals;
    private List<String> approvers;
    private String blockchainTxHash;
    private LocalDateTime createdAt;
    private List<MilestoneInfo> milestones;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MilestoneInfo {
        private String milestoneId;
        private String description;
        private Double amount;
        private String dueDate;
        private String status;
        private String proofCid;
        private String proofHash;
        private LocalDateTime submittedAt;
        private LocalDateTime approvedAt;
        private LocalDateTime releasedAt;
        private String rejectReason;
        private List<String> approvals;
        private List<String> rejections;
    }
}