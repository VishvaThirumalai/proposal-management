package com.startuphub.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendRequestDTO {
    private Long startupId;
    private Long recipientId;
    private String recipientRole; // MENTOR or INVESTOR
    private String message;
}