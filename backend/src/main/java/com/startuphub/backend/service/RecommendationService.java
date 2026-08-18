package com.startuphub.backend.service;

import com.startuphub.backend.model.*;
import com.startuphub.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final StartupRepository startupRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final InvestorProfileRepository investorProfileRepository;
    private final EmbeddingService embeddingService;
    private static final int TOP_N = 20;

    // ================================================================
    // RECOMMEND MENTORS - WITH AI SEMANTIC SIMILARITY
    // ================================================================
    @Transactional(readOnly = true)
    public List<MentorRecommendation> recommendMentors(Long startupId) {
        log.info("📊 recommendMentors() called for startup: {}", startupId);
        
        try {
            // ✅ Get the startup
            Startup startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));
            log.info("✅ Found startup: {}", startup.getTitle());

            // ✅ Generate embedding for startup
            log.info("🔍 Generating embedding for startup proposal...");
            List<Float> startupEmbedding = embeddingService.generateProposalEmbedding(startup);
            if (startupEmbedding.isEmpty()) {
                log.warn("⚠️ Failed to generate startup embedding, using fallback");
                return recommendMentorsFallback();
            }
            log.info("✅ Startup embedding generated: {} dimensions", startupEmbedding.size());
            
            // ✅ Get all approved mentors with user data loaded
            List<MentorProfile> mentors = mentorProfileRepository.findByVerificationStatus("APPROVED");
            log.info("✅ Found {} approved mentors in database", mentors.size());
            
            List<MentorRecommendation> recommendations = new ArrayList<>();
            
            for (MentorProfile mentor : mentors) {
                // ✅ Skip if mentor has no user
                if (mentor.getUser() == null) {
                    log.warn("⚠️ Skipping mentor {} - no user", mentor.getMentorId());
                    continue;
                }
                
                // ✅ Generate embedding for mentor
                List<Float> mentorEmbedding = embeddingService.generateMentorEmbedding(mentor);
                if (mentorEmbedding.isEmpty()) {
                    log.warn("⚠️ Failed to generate embedding for mentor: {}", mentor.getUser().getName());
                    continue;
                }
                
                // ✅ Calculate cosine similarity
                double similarity = cosineSimilarity(startupEmbedding, mentorEmbedding);
                
                String profileText = String.format("%s | %s | %d years | %s",
                        mentor.getDesignation() != null ? mentor.getDesignation() : "N/A",
                        mentor.getCompany() != null ? mentor.getCompany() : "N/A",
                        mentor.getYearsExperience() != null ? mentor.getYearsExperience() : 0,
                        mentor.getExpertise() != null ? mentor.getExpertise() : "N/A"
                );
                
                MentorRecommendation rec = new MentorRecommendation(mentor, similarity, profileText);
                recommendations.add(rec);
                log.info("   ✅ Added mentor: {} - similarity: {:.4f}", 
                         mentor.getUser().getName(), similarity);
            }

            // ✅ Sort by similarity (highest first)
            recommendations.sort((a, b) -> Double.compare(b.getSimilarity(), a.getSimilarity()));
            
            List<MentorRecommendation> result = recommendations.stream()
                    .limit(TOP_N)
                    .collect(Collectors.toList());
            
            log.info("✅ Returning {} mentor recommendations", result.size());
            return result;

        } catch (Exception e) {
            log.error("❌ ERROR in recommendMentors: {}", e.getMessage(), e);
            return recommendMentorsFallback();
        }
    }

    // ================================================================
    // RECOMMEND INVESTORS - WITH AI SEMANTIC SIMILARITY
    // ================================================================
    @Transactional(readOnly = true)
    public List<InvestorRecommendation> recommendInvestors(Long startupId) {
        log.info("📊 recommendInvestors() called for startup: {}", startupId);
        
        try {
            // ✅ Get the startup
            Startup startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));
            log.info("✅ Found startup: {}", startup.getTitle());

            // ✅ Generate embedding for startup
            log.info("🔍 Generating embedding for startup proposal...");
            List<Float> startupEmbedding = embeddingService.generateProposalEmbedding(startup);
            if (startupEmbedding.isEmpty()) {
                log.warn("⚠️ Failed to generate startup embedding, using fallback");
                return recommendInvestorsFallback();
            }
            log.info("✅ Startup embedding generated: {} dimensions", startupEmbedding.size());
            
            // ✅ Get all approved investors
            List<InvestorProfile> investors = investorProfileRepository.findByVerificationStatus("APPROVED");
            log.info("✅ Found {} approved investors in database", investors.size());
            
            List<InvestorRecommendation> recommendations = new ArrayList<>();
            
            for (InvestorProfile investor : investors) {
                // ✅ Skip if investor has no user
                if (investor.getUser() == null) {
                    log.warn("⚠️ Skipping investor {} - no user", investor.getInvestorId());
                    continue;
                }
                
                // ✅ Generate embedding for investor
                List<Float> investorEmbedding = embeddingService.generateInvestorEmbedding(investor);
                if (investorEmbedding.isEmpty()) {
                    log.warn("⚠️ Failed to generate embedding for investor: {}", investor.getUser().getName());
                    continue;
                }
                
                // ✅ Calculate cosine similarity
                double similarity = cosineSimilarity(startupEmbedding, investorEmbedding);
                
                String profileText = String.format("%s | %s | %s",
                        investor.getOrganization() != null ? investor.getOrganization() : "N/A",
                        investor.getInvestmentDomains() != null ? investor.getInvestmentDomains() : "N/A",
                        investor.getInvestmentStage() != null ? investor.getInvestmentStage() : "N/A"
                );
                
                InvestorRecommendation rec = new InvestorRecommendation(investor, similarity, profileText);
                recommendations.add(rec);
                log.info("   ✅ Added investor: {} - similarity: {:.4f}", 
                         investor.getUser().getName(), similarity);
            }

            // ✅ Sort by similarity (highest first)
            recommendations.sort((a, b) -> Double.compare(b.getSimilarity(), a.getSimilarity()));
            
            List<InvestorRecommendation> result = recommendations.stream()
                    .limit(TOP_N)
                    .collect(Collectors.toList());
            
            log.info("✅ Returning {} investor recommendations", result.size());
            return result;

        } catch (Exception e) {
            log.error("❌ ERROR in recommendInvestors: {}", e.getMessage(), e);
            return recommendInvestorsFallback();
        }
    }

    // ================================================================
    // GET MENTOR MATCH - WITH SEMANTIC SIMILARITY
    // ================================================================
    public double getMentorMatch(Long startupId, Long mentorId) {
        log.info("📊 getMentorMatch() called for startup: {}, mentor: {}", startupId, mentorId);
        try {
            Startup startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));
            MentorProfile mentor = mentorProfileRepository.findById(mentorId)
                    .orElseThrow(() -> new RuntimeException("Mentor not found"));
            
            List<Float> startupEmbedding = embeddingService.generateProposalEmbedding(startup);
            List<Float> mentorEmbedding = embeddingService.generateMentorEmbedding(mentor);
            
            if (startupEmbedding.isEmpty() || mentorEmbedding.isEmpty()) {
                return 0.5; // Fallback
            }
            
            return cosineSimilarity(startupEmbedding, mentorEmbedding);
        } catch (Exception e) {
            log.error("❌ Error calculating mentor match: {}", e.getMessage());
            return 0.0;
        }
    }

    // ================================================================
    // GET INVESTOR MATCH - WITH SEMANTIC SIMILARITY
    // ================================================================
    public double getInvestorMatch(Long startupId, Long investorId) {
        log.info("📊 getInvestorMatch() called for startup: {}, investor: {}", startupId, investorId);
        try {
            Startup startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));
            InvestorProfile investor = investorProfileRepository.findById(investorId)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));
            
            List<Float> startupEmbedding = embeddingService.generateProposalEmbedding(startup);
            List<Float> investorEmbedding = embeddingService.generateInvestorEmbedding(investor);
            
            if (startupEmbedding.isEmpty() || investorEmbedding.isEmpty()) {
                return 0.5; // Fallback
            }
            
            return cosineSimilarity(startupEmbedding, investorEmbedding);
        } catch (Exception e) {
            log.error("❌ Error calculating investor match: {}", e.getMessage());
            return 0.0;
        }
    }

    // ================================================================
    // HELPER: CALCULATE COSINE SIMILARITY
    // ================================================================
    private double cosineSimilarity(List<Float> a, List<Float> b) {
        if (a.size() != b.size()) {
            log.warn("⚠️ Embedding size mismatch: {} vs {}", a.size(), b.size());
            return 0.5;
        }
        
        float dotProduct = 0.0f;
        float magnitudeA = 0.0f;
        float magnitudeB = 0.0f;
        
        for (int i = 0; i < a.size(); i++) {
            dotProduct += a.get(i) * b.get(i);
            magnitudeA += a.get(i) * a.get(i);
            magnitudeB += b.get(i) * b.get(i);
        }
        
        magnitudeA = (float) Math.sqrt(magnitudeA);
        magnitudeB = (float) Math.sqrt(magnitudeB);
        
        if (magnitudeA == 0 || magnitudeB == 0) {
            return 0.5;
        }
        
        double similarity = dotProduct / (magnitudeA * magnitudeB);
        // Normalize to 0-1 range (cosine similarity is -1 to 1)
        return Math.max(0, Math.min(1, (similarity + 1) / 2));
    }

    // ================================================================
    // FALLBACK METHODS - If embeddings fail
    // ================================================================
    private List<MentorRecommendation> recommendMentorsFallback() {
        log.warn("⚠️ Using fallback recommendation for mentors (random selection)");
        try {
            List<MentorProfile> mentors = mentorProfileRepository.findByVerificationStatus("APPROVED");
            List<MentorRecommendation> recommendations = new ArrayList<>();
            
            Collections.shuffle(mentors);
            for (MentorProfile mentor : mentors) {
                if (mentor.getUser() != null) {
                    double fallbackSimilarity = 0.5 + (Math.random() * 0.3);
                    String profileText = mentor.getDesignation() + " | " + mentor.getExpertise();
                    recommendations.add(new MentorRecommendation(mentor, fallbackSimilarity, profileText));
                }
            }
            return recommendations.stream().limit(TOP_N).collect(Collectors.toList());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<InvestorRecommendation> recommendInvestorsFallback() {
        log.warn("⚠️ Using fallback recommendation for investors (random selection)");
        try {
            List<InvestorProfile> investors = investorProfileRepository.findByVerificationStatus("APPROVED");
            List<InvestorRecommendation> recommendations = new ArrayList<>();
            
            Collections.shuffle(investors);
            for (InvestorProfile investor : investors) {
                if (investor.getUser() != null) {
                    double fallbackSimilarity = 0.5 + (Math.random() * 0.3);
                    String profileText = investor.getOrganization() + " | " + investor.getInvestmentDomains();
                    recommendations.add(new InvestorRecommendation(investor, fallbackSimilarity, profileText));
                }
            }
            return recommendations.stream().limit(TOP_N).collect(Collectors.toList());
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    // ================================================================
    // INNER CLASSES - WITH FULL USER DATA
    // ================================================================

    public static class MentorRecommendation {
        private final MentorProfile mentor;
        private final double similarity;
        private final String profileText;

        public MentorRecommendation(MentorProfile mentor, double similarity, String profileText) {
            this.mentor = mentor;
            this.similarity = similarity;
            this.profileText = profileText;
        }

        public MentorProfile getMentor() { return mentor; }
        public double getSimilarity() { return similarity; }
        public String getProfileText() { return profileText; }
        
        // ✅ These methods directly access user data
        public String getName() { 
            return mentor.getUser() != null ? mentor.getUser().getName() : "Unknown";
        }
        public String getExpertise() { return mentor.getExpertise(); }
        public String getCompany() { return mentor.getCompany(); }
        public String getDesignation() { return mentor.getDesignation(); }
        public Integer getYearsExperience() { return mentor.getYearsExperience(); }
        public Long getId() { return mentor.getMentorId(); }
    }

    public static class InvestorRecommendation {
        private final InvestorProfile investor;
        private final double similarity;
        private final String profileText;

        public InvestorRecommendation(InvestorProfile investor, double similarity, String profileText) {
            this.investor = investor;
            this.similarity = similarity;
            this.profileText = profileText;
        }

        public InvestorProfile getInvestor() { return investor; }
        public double getSimilarity() { return similarity; }
        public String getProfileText() { return profileText; }
        
        // ✅ These methods directly access user data
        public String getName() { 
            return investor.getUser() != null ? investor.getUser().getName() : "Unknown";
        }
        public String getOrganization() { return investor.getOrganization(); }
        public String getInvestmentDomains() { return investor.getInvestmentDomains(); }
        public String getInvestmentStage() { return investor.getInvestmentStage(); }
        public Long getId() { return investor.getInvestorId(); }
    }
}