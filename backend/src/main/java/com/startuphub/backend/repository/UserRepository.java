package com.startuphub.backend.repository;

import com.startuphub.backend.model.User;
import com.startuphub.backend.model.enums.AccountStatus;
import com.startuphub.backend.model.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRoleAndStatus(Role role, String status);

    List<User> findByRole(Role role);

    Optional<User> findByWalletAddress(String walletAddress);

    // ✅ Fetch mentors with profiles loaded using JOIN FETCH
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.mentorProfile WHERE u.role = :role AND u.status = :status")
    List<User> findMentorsWithProfile(@Param("role") Role role, @Param("status") AccountStatus status);

    // ✅ Simplified version - just get pending mentors
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.mentorProfile WHERE u.role = 'MENTOR' AND u.status = 'PENDING'")
    List<User> findMentorsWithProfile();

    // ✅ Fetch investors with profiles loaded using JOIN FETCH
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.investorProfile WHERE u.role = :role AND u.status = :status")
    List<User> findInvestorsWithProfile(@Param("role") Role role, @Param("status") AccountStatus status);

    // ✅ Simplified version - just get pending investors
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.investorProfile WHERE u.role = 'INVESTOR' AND u.status = 'PENDING'")
    List<User> findInvestorsWithProfile();

    // ✅ Fetch all users with both profiles loaded
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.mentorProfile LEFT JOIN FETCH u.investorProfile")
    List<User> findAllUsersWithProfiles();
}