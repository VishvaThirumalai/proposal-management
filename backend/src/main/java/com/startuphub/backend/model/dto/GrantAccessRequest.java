package com.startuphub.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrantAccessRequest {
    private Long proposalId;
    private Long userId;
    private String role;  // MENTOR or INVESTOR
}