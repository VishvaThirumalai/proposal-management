package com.startuphub.backend.repository;

import com.startuphub.backend.model.Request;
import com.startuphub.backend.model.Startup;
import com.startuphub.backend.model.User;
import com.startuphub.backend.model.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends JpaRepository<Request, Long> {

    // ===== FIND BY USER =====
    List<Request> findByRecipient(User recipient);
    
    List<Request> findByFounder(User founder);
    
    List<Request> findByRecipientUserId(Long userId);
    
    List<Request> findByFounderUserId(Long userId);
    
    // ===== FIND BY STARTUP =====
    List<Request> findByStartup(Startup startup);
    
    List<Request> findByStartupStartupId(Long startupId);
    
    // ===== FIND BY STATUS =====
    List<Request> findByRecipientAndStatus(User recipient, RequestStatus status);
    
    List<Request> findByRecipientUserIdAndStatus(Long userId, RequestStatus status);
    
    // ===== FIND BY STARTUP AND USER =====
    Optional<Request> findByStartupAndRecipient(Startup startup, User recipient);
    
    Optional<Request> findByStartupStartupIdAndRecipientUserId(Long startupId, Long recipientId);
    
    // ===== FIND ACCEPTED =====
    @Query("SELECT r FROM Request r WHERE r.startup.startupId = :startupId AND r.recipient.userId = :recipientId AND r.status = 'ACCEPTED'")
    Optional<Request> findAcceptedByStartupAndRecipient(@Param("startupId") Long startupId, @Param("recipientId") Long recipientId);
    
    // ===== CHECK EXISTS =====
    boolean existsByStartupAndRecipientAndStatus(Startup startup, User recipient, RequestStatus status);
    
    // ===== UPDATE =====
    @Modifying
    @Query("UPDATE Request r SET r.status = :status, r.permissionGranted = :permissionGranted WHERE r.requestId = :requestId")
    int updateStatusAndPermission(@Param("requestId") Long requestId, 
                                   @Param("status") RequestStatus status, 
                                   @Param("permissionGranted") Boolean permissionGranted);
    
    // ===== FIND ALL WITH PERMISSION =====
    @Query("SELECT r FROM Request r WHERE r.status = 'ACCEPTED' AND r.permissionGranted = true")
    List<Request> findAcceptedAndGranted();

    
// Find by Startup ID and Recipient ID
@Query("SELECT r FROM Request r WHERE r.startup.startupId = :startupId AND r.recipient.userId = :recipientId")
Optional<Request> findByStartupIdAndRecipientId(@Param("startupId") Long startupId, @Param("recipientId") Long recipientId);

// Check exists by Startup and Recipient
boolean existsByStartupAndRecipient(Startup startup, User recipient);

}