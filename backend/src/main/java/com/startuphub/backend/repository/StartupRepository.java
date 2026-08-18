package com.startuphub.backend.repository;

import com.startuphub.backend.model.Startup;
import com.startuphub.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StartupRepository extends JpaRepository<Startup, Long> {

    List<Startup> findByFounder(User founder);

    @Query("SELECT s FROM Startup s WHERE s.founder.userId = :founderId")
    List<Startup> findByFounderId(@Param("founderId") Long founderId);

    List<Startup> findByStatus(String status);

    List<Startup> findByDomain(String domain);

    // ✅ Search by keyword in title, domain, summary, or keywords
    @Query("SELECT s FROM Startup s WHERE s.status = 'INDEXED' AND " +
           "(LOWER(s.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.domain) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.aiSummary) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.aiKeywords) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Startup> searchByKeyword(@Param("keyword") String keyword);
}