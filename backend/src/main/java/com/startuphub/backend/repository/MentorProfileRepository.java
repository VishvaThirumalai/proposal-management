package com.startuphub.backend.repository;

import com.startuphub.backend.model.MentorProfile;
import com.startuphub.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MentorProfileRepository extends JpaRepository<MentorProfile, Long> {
    Optional<MentorProfile> findByUser(User user);
    List<MentorProfile> findByVerificationStatus(String status);
}