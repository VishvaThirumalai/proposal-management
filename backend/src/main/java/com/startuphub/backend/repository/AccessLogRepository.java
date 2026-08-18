package com.startuphub.backend.repository;

import com.startuphub.backend.model.AccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {
    List<AccessLog> findByStartupStartupId(Long startupId);
    List<AccessLog> findByUserUserId(Long userId);
}