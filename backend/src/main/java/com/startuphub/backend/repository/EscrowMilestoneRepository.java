package com.startuphub.backend.repository;

import com.startuphub.backend.model.EscrowMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EscrowMilestoneRepository extends JpaRepository<EscrowMilestone, String> {

    List<EscrowMilestone> findByEscrowId(String escrowId);

    Optional<EscrowMilestone> findByEscrowIdAndMilestoneId(String escrowId, String milestoneId);
}