package com.startuphub.backend.repository;

import com.startuphub.backend.model.ReEncryptionKey;
import com.startuphub.backend.model.Startup;
import com.startuphub.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReEncryptionKeyRepository extends JpaRepository<ReEncryptionKey, Long> {

    Optional<ReEncryptionKey> findByRequestRequestId(Long requestId);
    
    // ✅ Both versions - with Startup object and with Startup ID
    Optional<ReEncryptionKey> findByStartupAndUser(Startup startup, User user);
    
    @Query("SELECT rk FROM ReEncryptionKey rk WHERE rk.startup.startupId = :startupId AND rk.user.userId = :userId")
    Optional<ReEncryptionKey> findByStartupIdAndUserId(@Param("startupId") Long startupId, @Param("userId") Long userId);
    
    Optional<ReEncryptionKey> findByStartupStartupIdAndUserUserId(Long startupId, Long userId);
    
    @Query("SELECT rk FROM ReEncryptionKey rk WHERE rk.startup.startupId = :startupId AND rk.user.userId = :userId AND rk.status = 'ACTIVE'")
    Optional<ReEncryptionKey> findActiveByStartupAndUser(@Param("startupId") Long startupId, @Param("userId") Long userId);
    
    @Modifying
    @Query("UPDATE ReEncryptionKey rk SET rk.status = 'REVOKED' WHERE rk.startup.startupId = :startupId AND rk.user.userId = :userId")
    void revokeByStartupAndUser(@Param("startupId") Long startupId, @Param("userId") Long userId);
}