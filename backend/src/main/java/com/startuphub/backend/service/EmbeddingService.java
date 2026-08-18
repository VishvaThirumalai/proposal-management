package com.startuphub.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.model.InvestorProfile;
import com.startuphub.backend.model.MentorProfile;
import com.startuphub.backend.model.Startup;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class EmbeddingService {

    // Default to the AI service that runs in this workspace (FastAPI on port 8000)
    @Value("${embedding.service.url:http://localhost:8000}")
    private String embeddingServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate embedding for a single text
     */
    public List<Float> generateEmbedding(String text) {
        try {
            if (text == null || text.trim().isEmpty()) {
                log.warn("⚠️ Empty text for embedding generation");
                return generateRandomEmbedding();
            }

            String url = embeddingServiceUrl + "/embed";
            
            Map<String, Object> request = new HashMap<>();
            request.put("texts", List.of(text));
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(request, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, httpRequest, String.class);
            
            if (response.getBody() == null) {
                log.error("❌ Embedding service returned empty response");
                return generateRandomEmbedding();
            }
            
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            JsonNode embeddings = jsonNode.get("embeddings");
            
            if (embeddings != null && embeddings.size() > 0) {
                List<Float> embedding = new ArrayList<>();
                for (JsonNode value : embeddings.get(0)) {
                    embedding.add((float) value.asDouble());
                }
                log.info("✅ Generated embedding with {} dimensions", embedding.size());
                return embedding;
            }
            
            return generateRandomEmbedding();
            
        } catch (Exception e) {
            log.error("❌ Embedding generation failed: {}", e.getMessage());
            return generateRandomEmbedding();
        }
    }

    /**
     * Generate proposal embedding from AI metadata
     */
    public List<Float> generateProposalEmbedding(Startup startup) {
        String text = buildProposalText(startup);
        log.info("📝 Generating embedding for proposal: {}", startup.getTitle());
        return generateEmbedding(text);
    }

    /**
     * Generate mentor embedding from profile
     */
    public List<Float> generateMentorEmbedding(MentorProfile mentor) {
        String text = buildMentorText(mentor);
        log.info("📝 Generating embedding for mentor: {}", mentor.getUser().getName());
        return generateEmbedding(text);
    }

    /**
     * Generate investor embedding from profile
     */
    public List<Float> generateInvestorEmbedding(InvestorProfile investor) {
        String text = buildInvestorText(investor);
        log.info("📝 Generating embedding for investor: {}", investor.getUser().getName());
        return generateEmbedding(text);
    }

    /**
     * Build proposal text from AI metadata
     */
    private String buildProposalText(Startup startup) {
        StringBuilder sb = new StringBuilder();
        if (startup.getAiSummary() != null) sb.append(startup.getAiSummary()).append(" ");
        if (startup.getAiKeywords() != null) sb.append(startup.getAiKeywords()).append(" ");
        if (startup.getAiTags() != null) sb.append(startup.getAiTags()).append(" ");
        if (startup.getAiTechnologyStack() != null) sb.append(startup.getAiTechnologyStack()).append(" ");
        if (startup.getAiProblemStatement() != null) sb.append(startup.getAiProblemStatement()).append(" ");
        if (startup.getAiSolution() != null) sb.append(startup.getAiSolution()).append(" ");
        if (startup.getAiBusinessModel() != null) sb.append(startup.getAiBusinessModel()).append(" ");
        if (startup.getDomain() != null) sb.append(startup.getDomain()).append(" ");
        if (startup.getTitle() != null) sb.append(startup.getTitle());
        return sb.toString();
    }

    /**
     * Build mentor text from profile
     */
    private String buildMentorText(MentorProfile mentor) {
        StringBuilder sb = new StringBuilder();
        if (mentor.getExpertise() != null) sb.append(mentor.getExpertise()).append(" ");
        if (mentor.getDesignation() != null) sb.append(mentor.getDesignation()).append(" ");
        if (mentor.getCompany() != null) sb.append(mentor.getCompany()).append(" ");
        if (mentor.getYearsExperience() != null) {
            sb.append(mentor.getYearsExperience()).append(" years experience");
        }
        return sb.toString();
    }

    /**
     * Build investor text from profile
     */
    private String buildInvestorText(InvestorProfile investor) {
        StringBuilder sb = new StringBuilder();
        if (investor.getInvestmentDomains() != null) sb.append(investor.getInvestmentDomains()).append(" ");
        if (investor.getInvestmentStage() != null) sb.append(investor.getInvestmentStage()).append(" ");
        if (investor.getOrganization() != null) sb.append(investor.getOrganization()).append(" ");
        if (investor.getUser() != null && investor.getUser().getName() != null) {
            sb.append(investor.getUser().getName());
        }
        return sb.toString();
    }

    /**
     * Calculate cosine similarity between two embeddings
     */
    public double cosineSimilarity(List<Float> v1, List<Float> v2) {
        if (v1 == null || v2 == null || v1.isEmpty() || v2.isEmpty() || v1.size() != v2.size()) {
            return 0.0;
        }
        
        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;
        
        for (int i = 0; i < v1.size(); i++) {
            dotProduct += v1.get(i) * v2.get(i);
            norm1 += v1.get(i) * v1.get(i);
            norm2 += v2.get(i) * v2.get(i);
        }
        
        if (norm1 == 0 || norm2 == 0) {
            return 0.0;
        }
        
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Generate random embedding (fallback)
     */
    private List<Float> generateRandomEmbedding() {
        List<Float> embedding = new ArrayList<>();
        Random random = new Random();
        for (int i = 0; i < 384; i++) {
            embedding.add(random.nextFloat());
        }
        return embedding;
    }
}