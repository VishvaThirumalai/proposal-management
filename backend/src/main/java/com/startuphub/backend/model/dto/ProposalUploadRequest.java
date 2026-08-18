package com.startuphub.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalUploadRequest {
    private String title;
    private String domain;
    private String stage;
    private Double fundingAmount;
    
    // AI Metadata Fields
    private String aiSummary;
    private String aiKeywords;
    private String aiTags;
    private String aiProblemStatement;
    private String aiSolution;
    private String aiTechnologyStack;
    private String aiMentorRequirements;
    private String aiInvestorPitch;
    private String aiBusinessModel;
    private String aiFundingPurpose;
}