package com.startuphub.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "mentor_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mentor_id")
    private Long mentorId;

    @JsonIgnore  // ✅ Prevents recursion
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 200)
    private String company;

    @Column(length = 100)
    private String designation;

    @Column(name = "years_experience")
    private Integer yearsExperience;

    @Column(name = "expertise", columnDefinition = "TEXT")
    private String expertise;

    @Column(length = 500)
    private String linkedin;

    @Column(name = "verification_status")
    private String verificationStatus;

    @Column(name = "embedding", columnDefinition = "JSON")
    private String embedding;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (verificationStatus == null) verificationStatus = "PENDING";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}