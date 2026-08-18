package com.startuphub.backend.model.dto;

import com.startuphub.backend.model.enums.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestResponseDTO {
    private Long requestId;
    private Long startupId;
    private String startupTitle;
    private Long founderId;
    private String founderName;
    private Long recipientId;
    private String recipientName;
    private String recipientRole;
    private String message;
    private RequestStatus status;
    private Boolean permissionGranted;
    private String blockchainTxHash;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}