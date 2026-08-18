package com.startuphub.backend.model;

import com.startuphub.backend.model.Startup;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "pre_encryption_params")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreEncryptionParams {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "startup_id", nullable = false)
    private Startup startup;

    @Column(name = "founder_wallet", nullable = false)
    private String founderWallet;

    @Column(name = "aes_key_hash", nullable = false)
    private String aesKeyHash;

    @Column(name = "e_param", nullable = false, columnDefinition = "TEXT")
    private String eParam;

    @Column(name = "u_param", nullable = false, columnDefinition = "TEXT")
    private String uParam;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}