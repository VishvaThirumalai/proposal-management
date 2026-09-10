package com.startuphub.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.model.Startup;
import com.startuphub.backend.model.StartupVersion;
import com.startuphub.backend.model.User;
import com.startuphub.backend.model.enums.StartupStage;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.StartupVersionRepository;
import com.startuphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalUpdateService {

    private final StartupRepository startupRepository;
    private final StartupVersionRepository startupVersionRepository;
    private final UserRepository userRepository;
    private final IPFSService ipfsService;
    private final FabricService fabricService;
    private final DCHService dchService;
    private final ObjectMapper objectMapper;

    @Transactional
    public Startup updateProposal(
            Long founderId,
            Long startupId,
            String title,
            String domain,
            String stage,
            Double fundingAmount,
            String summary,
            String keywords,
            String technologyStack,
            String mentorRequirements,
            String investorPitch,
            String problemStatement,
            String solution,
            String businessModel
    ) throws Exception {

        log.info("📝 Starting proposal update for startup ID: {}", startupId);

        // 1. Verify founder owns the proposal
        User founder = userRepository.findById(founderId)
                .orElseThrow(() -> new RuntimeException("Founder not found"));

        Startup startup = startupRepository.findById(startupId)
                .orElseThrow(() -> new RuntimeException("Startup not found"));

        if (!startup.getFounder().getUserId().equals(founder.getUserId())) {
            throw new RuntimeException("You don't own this proposal");
        }

        log.info("✅ Founder verified: {}", founder.getName());

        // 2. Save current version as archive
        saveVersion(startup);
        log.info("📦 Version {} archived", startup.getVersion());

        // 3. Update startup record
        if (title != null) startup.setTitle(title);
        if (domain != null) startup.setDomain(domain);
        if (stage != null) {
            startup.setStage(StartupStage.valueOf(stage.toUpperCase()));
        }
        if (fundingAmount != null) startup.setFundingAmount(fundingAmount);
        if (summary != null) startup.setAiSummary(summary);
        if (keywords != null) startup.setAiKeywords(keywords);
        if (technologyStack != null) startup.setAiTechnologyStack(technologyStack);
        if (mentorRequirements != null) startup.setAiMentorRequirements(mentorRequirements);
        if (investorPitch != null) startup.setAiInvestorPitch(investorPitch);
        if (problemStatement != null) startup.setAiProblemStatement(problemStatement);
        if (solution != null) startup.setAiSolution(solution);
        if (businessModel != null) startup.setAiBusinessModel(businessModel);

        // 4. Generate TMeta for clustering
        String tMeta = generateTMeta(domain != null ? domain : startup.getDomain());

        // 5. Generate DCH random parameter
        String oldRandomParam = startup.getDchRandomParam();
        String newRandomParam;

        if (oldRandomParam == null || oldRandomParam.isEmpty()) {
            // First time using DCH - generate initial params
            DCHService.DCHParams dchParams = dchService.generateDCHParams();
            newRandomParam = dchParams.getRandomParam();

            // Initialize DCH on blockchain
            fabricService.initDCH(
                dchParams.getPublicKey(),
                newRandomParam,
                dchParams.getPublicKey(),
                dchParams.getModulus(),
                dchParams.getGenerator()
            );
            log.info("🔑 DCH initialized on blockchain");
        } else {
            // Find collision for update
            String oldContent = startup.getAiSummary() != null ? startup.getAiSummary() : "";
            String newContent = summary != null ? summary : startup.getAiSummary();

            if (!oldContent.equals(newContent)) {
                newRandomParam = dchService.findCollision(
                    "PROP_" + startupId,
                    oldContent,
                    newContent,
                    oldRandomParam
                );
            } else {
                newRandomParam = dchService.generateRandomParam();
            }

            if (newRandomParam == null) {
                throw new RuntimeException("Failed to compute DCH collision");
            }
        }

        // 6. Store DCH random parameter
        startup.setDchRandomParam(newRandomParam);
        startup.setVersion(startup.getVersion() + 1);
        startup.setStatus("INDEXED");
        startup.setUpdatedAt(LocalDateTime.now());

        // 7. Save to MySQL
        Startup updatedStartup = startupRepository.save(startup);
        log.info("💾 Startup updated in MySQL: ID {}", updatedStartup.getStartupId());

        // 8. Update on Blockchain with DCH
        String proposalId = "PROP_" + startupId;
        try {
            fabricService.updateProposalWithDCH(
                proposalId,
                startup.getIpfsCid() != null ? startup.getIpfsCid() : "QmPlaceholder...",
                startup.getSha256Hash() != null ? startup.getSha256Hash() : "0xPlaceholder...",
                tMeta,
                startup.getAiSummary() != null ? startup.getAiSummary() : "",
                startup.getAiKeywords() != null ? startup.getAiKeywords() : "",
                newRandomParam
            );
            log.info("⛓️ Blockchain updated with DCH for proposal: {}", proposalId);
        } catch (Exception e) {
            log.error("❌ Failed to update blockchain: {}", e.getMessage());
            throw new RuntimeException("Blockchain update failed: " + e.getMessage());
        }

        log.info("✅ Proposal update complete! New version: {}", updatedStartup.getVersion());
        return updatedStartup;
    }

    private void saveVersion(Startup startup) {
        try {
            StartupVersion version = StartupVersion.builder()
                    .startup(startup)
                    .versionNumber(startup.getVersion())
                    .ipfsCid(startup.getIpfsCid())
                    .sha256Hash(startup.getSha256Hash())
                    .tMeta(startup.getTMeta())
                    .aiSummary(startup.getAiSummary())
                    .aiKeywords(startup.getAiKeywords())
                    .status("ARCHIVED")
                    .createdAt(LocalDateTime.now())
                    .build();

            startupVersionRepository.save(version);
        } catch (Exception e) {
            log.error("❌ Failed to save version: {}", e.getMessage());
        }
    }

    private String generateTMeta(String domain) {
        if (domain == null || domain.isEmpty()) {
            domain = "GENERAL";
        }
        return domain.toUpperCase() + "_CLUSTER_" + System.currentTimeMillis() % 1000;
    }
}