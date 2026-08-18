package com.startuphub.backend.repository;

import com.startuphub.backend.model.InvestorProfile;
import com.startuphub.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestorProfileRepository extends JpaRepository<InvestorProfile, Long> {
    Optional<InvestorProfile> findByUser(User user);
    List<InvestorProfile> findByVerificationStatus(String status);
}