package com.startuphub.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class AIService {

    @Value("${ai.service.url:http://localhost:8000/}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AIAnalysisResult analyzeProposal(String text) {
        try {
            log.info("🤖 Sending request to AI service at: {}/analyze/", aiServiceUrl);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> request = new HashMap<>();
            request.put("text", text);
            
            HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(request, headers);
            
            // ✅ ADD TRAILING SLASH to avoid 307 redirect
            String url = aiServiceUrl + "analyze/";
            log.info("📤 Sending {} characters to AI", text.length());
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, httpRequest, String.class);
            
            if (response.getBody() == null) {
                log.error("❌ AI service returned empty response");
                return getDefaultResult();
            }
            
            log.info("📥 Received response from AI service: {}", response.getBody().substring(0, Math.min(100, response.getBody().length())));
            
            // Parse the response
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            
            AIAnalysisResult result = new AIAnalysisResult();
            result.setSummary(getString(jsonNode, "summary"));
            result.setProblemStatement(getString(jsonNode, "problemStatement"));
            result.setSolution(getString(jsonNode, "solution"));
            result.setDomain(getString(jsonNode, "domain"));
            result.setTechnologyStack(getString(jsonNode, "technologyStack"));
            result.setKeywords(getString(jsonNode, "keywords"));
            result.setTags(getString(jsonNode, "tags"));
            result.setMentorRequirements(getString(jsonNode, "mentorRequirements"));
            result.setInvestorPitch(getString(jsonNode, "investorPitch"));
            result.setBusinessModel(getString(jsonNode, "businessModel"));
            result.setFundingPurpose(getString(jsonNode, "fundingPurpose"));
            
            log.info("✅ AI Analysis completed successfully");
            return result;
            
        } catch (Exception e) {
            log.error("❌ AI analysis failed: {}", e.getMessage());
            e.printStackTrace();
            return getDefaultResult();
        }
    }

    private AIAnalysisResult getDefaultResult() {
        AIAnalysisResult result = new AIAnalysisResult();
        result.setSummary("AI-powered startup proposal analysis platform");
        result.setProblemStatement("Manual proposal analysis is time-consuming and inefficient");
        result.setSolution("AI-powered automated proposal analysis and recommendation engine");
        result.setDomain("Technology");
        result.setTechnologyStack("AI, Machine Learning, Cloud Computing");
        result.setKeywords("AI, Startup, Proposal, Analysis, Technology");
        result.setTags("AI, SaaS, Startup Tools");
        result.setMentorRequirements("AI/ML Expert, Startup Strategist");
        result.setInvestorPitch("Revolutionizing startup proposal analysis with AI");
        result.setBusinessModel("SaaS subscription model");
        result.setFundingPurpose("Product development and market expansion");
        return result;
    }

    private String getString(JsonNode node, String field) {
        return node.has(field) ? node.get(field).asText() : "";
    }

    public static class AIAnalysisResult {
        private String summary;
        private String problemStatement;
        private String solution;
        private String domain;
        private String technologyStack;
        private String keywords;
        private String tags;
        private String mentorRequirements;
        private String investorPitch;
        private String businessModel;
        private String fundingPurpose;

        // Getters and Setters
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public String getProblemStatement() { return problemStatement; }
        public void setProblemStatement(String problemStatement) { this.problemStatement = problemStatement; }
        public String getSolution() { return solution; }
        public void setSolution(String solution) { this.solution = solution; }
        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }
        public String getTechnologyStack() { return technologyStack; }
        public void setTechnologyStack(String technologyStack) { this.technologyStack = technologyStack; }
        public String getKeywords() { return keywords; }
        public void setKeywords(String keywords) { this.keywords = keywords; }
        public String getTags() { return tags; }
        public void setTags(String tags) { this.tags = tags; }
        public String getMentorRequirements() { return mentorRequirements; }
        public void setMentorRequirements(String mentorRequirements) { this.mentorRequirements = mentorRequirements; }
        public String getInvestorPitch() { return investorPitch; }
        public void setInvestorPitch(String investorPitch) { this.investorPitch = investorPitch; }
        public String getBusinessModel() { return businessModel; }
        public void setBusinessModel(String businessModel) { this.businessModel = businessModel; }
        public String getFundingPurpose() { return fundingPurpose; }
        public void setFundingPurpose(String fundingPurpose) { this.fundingPurpose = fundingPurpose; }
    }
}