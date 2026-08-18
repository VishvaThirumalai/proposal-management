package com.startuphub.backend.repository;

import com.startuphub.backend.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByToken(String token);
    
    // ✅ Use @Modifying and @Query for better control
    @Modifying
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.user.userId = :userId")
    void deleteByUser_UserId(@Param("userId") Long userId);
    
    void deleteByToken(String token);
}