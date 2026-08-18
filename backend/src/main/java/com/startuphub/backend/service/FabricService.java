package com.startuphub.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Service
@Slf4j
public class FabricService {

    @Value("${blockchain.enabled:false}")
    private boolean blockchainEnabled;

    private boolean isConnected = false;

    @PostConstruct
    public void init() {
        if (blockchainEnabled) {
            log.info("🔗 Blockchain mode: ENABLED");
            isConnected = true;
        } else {
            log.info("📦 Blockchain mode: MOCK (set blockchain.enabled=true to enable real Fabric)");
            isConnected = false;
        }
    }

    @PreDestroy
    public void disconnect() {
        log.info("✅ Disconnected from Fabric (mock)");
    }

    public boolean isConnected() {
        return isConnected && blockchainEnabled;
    }

    public String submitTransaction(String function, String... args) throws Exception {
        log.info("📦 MOCK: submitTransaction({}) with args: {}", function, String.join(", ", args));
        return "mock_tx_" + System.currentTimeMillis();
    }

    public String evaluateTransaction(String function, String... args) throws Exception {
        log.info("📦 MOCK: evaluateTransaction({})", function);
        return getMockResponse(function);
    }

    private String getMockResponse(String function) {
        if ("GetAllProposals".equals(function)) {
            return "[{\"id\":\"MOCK_PROP_001\",\"founderId\":\"FOUNDER_001\",\"title\":\"Mock Proposal\",\"domain\":\"Technology\",\"stage\":\"Prototype\",\"fundingAmount\":1000000,\"ipfsCid\":\"QmMock123...\",\"sha256Hash\":\"0xmock...\",\"tMeta\":\"TECH_CLUSTER\",\"version\":1,\"status\":\"ACTIVE\",\"summary\":\"Mock proposal summary\",\"keywords\":\"AI, Blockchain\",\"technologyStack\":\"Java, Python\",\"mentorRequirements\":\"AI Expert\",\"investorPitch\":\"Mock pitch\",\"problemStatement\":\"Mock problem\",\"solution\":\"Mock solution\",\"businessModel\":\"Mock business model\",\"timestamp\":\"2026-07-27T23:00:00Z\"}]";
        } else if ("CheckPermission".equals(function)) {
            return "true";
        }
        return "[]";
    }

    // ===== PROPOSAL FUNCTIONS =====

    public String createProposal(
            String id, String founderId, String title, String domain, String stage,
            String fundingAmount, String ipfsCid, String sha256Hash, String tMeta,
            String summary, String keywords, String technologyStack,
            String mentorRequirements, String investorPitch,
            String problemStatement, String solution, String businessModel
    ) throws Exception {
        return submitTransaction("CreateProposal",
                id, founderId, title, domain, stage, fundingAmount,
                ipfsCid, sha256Hash, tMeta,
                summary, keywords, technologyStack,
                mentorRequirements, investorPitch,
                problemStatement, solution, businessModel
        );
    }

    public String readProposal(String id) throws Exception {
        return evaluateTransaction("ReadProposal", id);
    }

    public String updateProposal(String id, String ipfsCid, String sha256Hash, String tMeta,
                                  String summary, String keywords) throws Exception {
        return submitTransaction("UpdateProposal", id, ipfsCid, sha256Hash, tMeta, summary, keywords);
    }

    public String getAllProposals() throws Exception {
        return evaluateTransaction("GetAllProposals");
    }

    public String getProposalsByFounder(String founderId) throws Exception {
        return evaluateTransaction("GetProposalsByFounder", founderId);
    }

    // ===== ACCESS CONTROL =====

    public String grantAccess(String proposalId, String userId, String userRole, String grantedBy) throws Exception {
        return submitTransaction("GrantAccess", proposalId, userId, userRole, grantedBy);
    }

    public String revokeAccess(String proposalId, String userId) throws Exception {
        return submitTransaction("RevokeAccess", proposalId, userId);
    }

    public String checkPermission(String proposalId, String userId) throws Exception {
        return evaluateTransaction("CheckPermission", proposalId, userId);
    }
}