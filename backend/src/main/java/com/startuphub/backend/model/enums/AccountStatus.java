package com.startuphub.backend.model.enums;  
public enum AccountStatus {
    PENDING,   // For mentors and investors waiting for admin approval
    APPROVED,  // For founders (auto-approved) and verified mentors/investors
    REJECTED   // For rejected mentors/investors
}