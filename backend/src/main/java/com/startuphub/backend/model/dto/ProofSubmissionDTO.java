package com.startuphub.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofSubmissionDTO {
    private String escrowId;
    private String milestoneId;
    private MultipartFile proofFile;
    private String proofNotes;
}