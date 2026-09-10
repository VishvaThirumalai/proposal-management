package com.startuphub.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProposalRequest {
    private Long startupId;
    private String title;
    private String domain;
    private String stage;
    private Double fundingAmount;
    private String summary;
    private String keywords;
    private String technologyStack;
    private String mentorRequirements;
    private String investorPitch;
    private String problemStatement;
    private String solution;
    private String businessModel;
}