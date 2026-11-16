package com.startuphub.backend.repository;

import com.startuphub.backend.model.Escrow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EscrowRepository extends JpaRepository<Escrow, String> {

    List<Escrow> findByStartupId(Long startupId);
    List<Escrow> findByInvestorId(Long investorId);
    List<Escrow> findByFounderId(Long founderId);
    List<Escrow> findByStatus(String status);
    
    Optional<Escrow> findByEscrowId(String escrowId);

    
}