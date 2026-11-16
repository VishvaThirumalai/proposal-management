package com.startuphub.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscrowRequestDTO {
    private String startupId;
    private String investorId;
    private String founderId;
    private Double totalAmount;
    private List<MilestoneDTO> milestones;
    private List<String> approvers;
}