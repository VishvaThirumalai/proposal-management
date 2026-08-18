package com.startuphub.backend.service;

import com.startuphub.backend.model.Startup;
import com.startuphub.backend.model.User;
import com.startuphub.backend.model.enums.StartupStage;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.SecretKey;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProposalService {

    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final IPFSService ipfsService;
    private final PDFExtractorService pdfExtractorService;
    private final AIService aiService;
    private final FabricService fabricService;

    @Transactional
    public Startup uploadProposal(
            Long founderId,
            String title,
            String domain,
            String stage,
            Double fundingAmount,
            MultipartFile proposalFile
    ) throws Exception {

        log.info("📝 Starting proposal upload for founder ID: {}", founderId);

        // 1. Get founder by ID
        User founder = userRepository.findById(founderId)
                .orElseThrow(() -> new RuntimeException("Founder not found with ID: " + founderId));

        // 2. Extract text from PDF
        log.info("📄 Extracting text from PDF...");
        String extractedText = "";
        try {
            extractedText = pdfExtractorService.extractText(proposalFile);
            log.info("✅ Extracted {} characters", extractedText.length());
        } catch (Exception e) {
            log.error("❌ Failed to extract text: {}", e.getMessage());
            extractedText = new String(proposalFile.getBytes());
            log.info("📄 Using raw file content ({} chars)", extractedText.length());
        }

        if (extractedText.isEmpty()) {
            extractedText = "Proposal: " + proposalFile.getOriginalFilename() +
                    ". This is a startup proposal. Please refer to the original document.";
            log.warn("⚠️ No text extracted, using fallback content");
        }

        // 3. AI Analysis
        log.info("🤖 Analyzing proposal with AI...");
        AIService.AIAnalysisResult aiResult = aiService.analyzeProposal(extractedText);

        // 4. Generate AES Key and Encrypt the proposal
        log.info("🔐 Generating AES key and encrypting proposal...");
        SecretKey aesKey = ipfsService.generateAESKey();
        byte[] encryptedFile = ipfsService.encryptAES(proposalFile.getBytes(), aesKey);

        // 5. Upload encrypted file to IPFS
        String cid = ipfsService.uploadToIPFS(encryptedFile);
        String sha256Hash = ipfsService.generateSHA256(encryptedFile);
        log.info("📦 Uploaded to IPFS with CID: {}", cid);

        // 6. ✅ Encrypt AES Key with Founder's PUBLIC KEY (for secure storage)
        String encryptedAesKey = ipfsService.encryptWithPublicKey(
                Base64.getEncoder().encodeToString(aesKey.getEncoded()),
                founder.getPublicKey()
        );
        log.info("🔑 AES Key encrypted with Founder's public key");

        // 7. Create startup record with encrypted AES key
        Startup startup = Startup.builder()
                .founder(founder)
                .title(title)
                .domain(domain != null ? domain : aiResult.getDomain())
                .stage(StartupStage.valueOf(stage != null ? stage.toUpperCase() : "IDEA"))
                .fundingAmount(fundingAmount)
                .aiSummary(aiResult.getSummary())
                .aiKeywords(aiResult.getKeywords())
                .aiTags(aiResult.getTags())
                .aiTechnologyStack(aiResult.getTechnologyStack())
                .aiMentorRequirements(aiResult.getMentorRequirements())
                .aiInvestorPitch(aiResult.getInvestorPitch())
                .aiProblemStatement(aiResult.getProblemStatement())
                .aiSolution(aiResult.getSolution())
                .aiBusinessModel(aiResult.getBusinessModel())
                .ipfsCid(cid)
                .sha256Hash(sha256Hash)
                .encryptedAesKey(encryptedAesKey)  // ✅ Store encrypted AES key
                .status("METADATA_REVIEW")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Startup savedStartup = startupRepository.save(startup);
        log.info("💾 Startup saved to MySQL with ID: {}", savedStartup.getStartupId());

        // 8. Generate TMeta
        String tMeta = generateTMeta(aiResult);

        // 9. Store on Blockchain
        String proposalId = "PROP_" + savedStartup.getStartupId();
        log.info("⛓️ Storing on Hyperledger Fabric...");

        try {
            fabricService.createProposal(
                    proposalId,
                    founder.getUserId().toString(),
                    title,
                    domain != null ? domain : aiResult.getDomain(),
                    stage != null ? stage : "IDEA",
                    String.valueOf(fundingAmount != null ? fundingAmount : 0),
                    cid,
                    sha256Hash,
                    tMeta,
                    aiResult.getSummary(),
                    aiResult.getKeywords(),
                    aiResult.getTechnologyStack(),
                    aiResult.getMentorRequirements(),
                    aiResult.getInvestorPitch(),
                    aiResult.getProblemStatement(),
                    aiResult.getSolution(),
                    aiResult.getBusinessModel()
            );
            log.info("✅ Stored on blockchain with ID: {}", proposalId);
        } catch (Exception e) {
            log.error("❌ Failed to store on blockchain: {}", e.getMessage());
        }

        // 10. Update startup with blockchain data
        savedStartup.setTMeta(tMeta);
        savedStartup.setBlockchainTxHash(proposalId);
        savedStartup.setStatus("INDEXED");
        savedStartup.setUpdatedAt(LocalDateTime.now());

        Startup finalStartup = startupRepository.save(savedStartup);
        log.info("✅ Proposal upload complete! Startup ID: {}", finalStartup.getStartupId());

        return finalStartup;
    }

    private String generateTMeta(AIService.AIAnalysisResult aiResult) {
        String domain = aiResult.getDomain();
        if (domain == null || domain.isEmpty()) {
            domain = "GENERAL";
        }
        return domain.toUpperCase() + "_CLUSTER_" + System.currentTimeMillis() % 1000;
    }
}