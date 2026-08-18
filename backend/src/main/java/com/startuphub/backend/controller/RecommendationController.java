package com.startuphub.backend.controller;

import com.startuphub.backend.config.JwtUtil;
import com.startuphub.backend.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recommend")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final JwtUtil jwtUtil;

    // ==========================================
    // GET TOP 20 MENTORS
    // ==========================================
    @GetMapping("/mentors/{startupId}")
    public ResponseEntity<?> getMentorRecommendations(
            HttpServletRequest request,
            @PathVariable Long startupId
    ) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtil.extractUserId(token);

            if (userId == null) {
                return ResponseEntity.badRequest().body("User ID not found in token");
            }

            List<RecommendationService.MentorRecommendation> recommendations = 
                    recommendationService.recommendMentors(startupId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", recommendations.size());
            response.put("recommendations", recommendations);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to get mentor recommendations: " + e.getMessage());
        }
    }

    // ==========================================
    // GET TOP 20 INVESTORS
    // ==========================================
    @GetMapping("/investors/{startupId}")
    public ResponseEntity<?> getInvestorRecommendations(
            HttpServletRequest request,
            @PathVariable Long startupId
    ) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtil.extractUserId(token);

            if (userId == null) {
                return ResponseEntity.badRequest().body("User ID not found in token");
            }

            List<RecommendationService.InvestorRecommendation> recommendations = 
                    recommendationService.recommendInvestors(startupId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", recommendations.size());
            response.put("recommendations", recommendations);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to get investor recommendations: " + e.getMessage());
        }
    }

    // ==========================================
    // GET MENTOR MATCH SCORE
    // ==========================================
    @GetMapping("/mentor-match/{startupId}/{mentorId}")
    public ResponseEntity<?> getMentorMatch(
            HttpServletRequest request,
            @PathVariable Long startupId,
            @PathVariable Long mentorId
    ) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtil.extractUserId(token);

            if (userId == null) {
                return ResponseEntity.badRequest().body("User ID not found in token");
            }

            double match = recommendationService.getMentorMatch(startupId, mentorId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("matchPercentage", (int) Math.round(match * 100));
            response.put("matchScore", match);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to get mentor match: " + e.getMessage());
        }
    }

    // ==========================================
    // GET INVESTOR MATCH SCORE
    // ==========================================
    @GetMapping("/investor-match/{startupId}/{investorId}")
    public ResponseEntity<?> getInvestorMatch(
            HttpServletRequest request,
            @PathVariable Long startupId,
            @PathVariable Long investorId
    ) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            Long userId = jwtUtil.extractUserId(token);

            if (userId == null) {
                return ResponseEntity.badRequest().body("User ID not found in token");
            }

            double match = recommendationService.getInvestorMatch(startupId, investorId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("matchPercentage", (int) Math.round(match * 100));
            response.put("matchScore", match);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to get investor match: " + e.getMessage());
        }
    }
}