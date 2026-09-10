package com.startuphub.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.config.JwtUtil;
import com.startuphub.backend.model.*;
import com.startuphub.backend.model.dto.*;
import com.startuphub.backend.model.enums.RequestStatus;
import com.startuphub.backend.repository.*;
import com.startuphub.backend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/founder")
@RequiredArgsConstructor
@PreAuthorize("hasRole('FOUNDER')")
@Slf4j
public class FounderController {

    // ===== SERVICES =====
    private final ProposalService proposalService;
    private final JwtUtil jwtUtil;
    private final RecommendationService recommendationService;
    private final IPFSService ipfsService;
    private final FabricService fabricService;
    private final PDFExtractorService pdfExtractorService;
    private final AIService aiService;
    private final ProposalUpdateService proposalUpdateService;
    private final DCHService dchService;

    // ===== REPOSITORIES =====
    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final RequestRepository requestRepository;
    private final ReEncryptionKeyRepository reEncryptionKeyRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final InvestorProfileRepository investorProfileRepository;
    private final StartupVersionRepository startupVersionRepository;

    // ===== OBJECT MAPPER =====
    private final ObjectMapper objectMapper;

    // ================================================================
    // 1. PREVIEW AI ANALYSIS
    // ================================================================
    @PostMapping(value = "/preview-ai", consumes = "multipart/form-data")
    public ResponseEntity<?> previewAI(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("📄 AI Preview called for file: {}", file.getOriginalFilename());
            
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            Long founderId = jwtUtil.extractUserId(token);

            if (founderId == null) {
                return ResponseEntity.badRequest().body("User ID not found in token");
            }

            // 1. Extract text from PDF
            String extractedText = pdfExtractorService.extractText(file);
            log.info("✅ Extracted {} characters", extractedText.length());

            // 2. AI Analysis
            AIService.AIAnalysisResult aiResult = aiService.analyzeProposal(extractedText);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("summary", aiResult.getSummary());
            response.put("problemStatement", aiResult.getProblemStatement());
            response.put("solution", aiResult.getSolution());
            response.put("domain", aiResult.getDomain());
            response.put("technologyStack", aiResult.getTechnologyStack());
            response.put("keywords", aiResult.getKeywords());
            response.put("tags", aiResult.getTags());
            response.put("mentorRequirements", aiResult.getMentorRequirements());
            response.put("investorPitch", aiResult.getInvestorPitch());
            response.put("businessModel", aiResult.getBusinessModel());
            response.put("fundingPurpose", aiResult.getFundingPurpose());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ AI Preview failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("AI Preview failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 2. UPLOAD PROPOSAL
    // ================================================================
    @PostMapping(value = "/upload-proposal", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadProposal(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file,
            @RequestPart("details") String detailsJson) {
        try {
            log.info("📤 Upload proposal called for file: {}", file.getOriginalFilename());
            log.info("📤 Details JSON: {}", detailsJson);
            
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            Long founderId = jwtUtil.extractUserId(token);

            if (founderId == null) {
                return ResponseEntity.badRequest().body("User ID not found in token");
            }

            // Use the injected objectMapper
            ProposalUploadRequest proposalRequest = objectMapper.readValue(detailsJson, ProposalUploadRequest.class);

            Startup startup = proposalService.uploadProposal(
                    founderId,
                    proposalRequest.getTitle(),
                    proposalRequest.getDomain(),
                    proposalRequest.getStage(),
                    proposalRequest.getFundingAmount(),
                    file
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Proposal uploaded successfully!");
            response.put("startupId", startup.getStartupId());
            response.put("title", startup.getTitle());
            response.put("status", startup.getStatus());
            response.put("ipfsCid", startup.getIpfsCid());
            response.put("blockchainTx", startup.getBlockchainTxHash());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Upload failed: {}", e.getMessage(), e);
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 3. GET ALL PROPOSALS
    // ================================================================
    @GetMapping("/proposals")
    public ResponseEntity<?> getProposals(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            Long founderId = jwtUtil.extractUserId(token);

            if (founderId == null) {
                return ResponseEntity.badRequest().body("User ID not found in token");
            }

            List<Startup> proposals = startupRepository.findByFounderId(founderId);

            List<Map<String, Object>> cleanProposals = new ArrayList<>();
            for (Startup s : proposals) {
                Map<String, Object> clean = new HashMap<>();
                clean.put("startupId", s.getStartupId());
                clean.put("title", s.getTitle());
                clean.put("domain", s.getDomain());
                clean.put("stage", s.getStage());
                clean.put("fundingAmount", s.getFundingAmount());
                clean.put("ipfsCid", s.getIpfsCid());
                clean.put("sha256Hash", s.getSha256Hash());
                clean.put("tMeta", s.getTMeta());
                clean.put("dchRandomParam", s.getDchRandomParam());
                clean.put("status", s.getStatus());
                clean.put("aiSummary", s.getAiSummary());
                clean.put("aiKeywords", s.getAiKeywords());
                clean.put("aiTags", s.getAiTags());
                clean.put("createdAt", s.getCreatedAt());
                clean.put("updatedAt", s.getUpdatedAt());
                cleanProposals.add(clean);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", cleanProposals.size());
            response.put("proposals", cleanProposals);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Failed to get proposals: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get proposals: " + e.getMessage());
        }
    }

    // ================================================================
    // 4. GET RECOMMENDATIONS
    // ================================================================
    @GetMapping("/recommendations/{startupId}")
    public ResponseEntity<?> getRecommendations(@PathVariable Long startupId) {
        try {
            log.info("📊 Found recommendations endpoint called for startup: {}", startupId);
            
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User founder = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            log.info("👤 Founder: {}", founder.getName());

            Startup startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));
            log.info("📝 Startup: {}", startup.getTitle());
            
            if (!startup.getFounder().getUserId().equals(founder.getUserId())) {
                return ResponseEntity.status(403).body("You don't own this startup");
            }

            log.info("🔄 Calling recommendationService.recommendMentors()...");
            List<RecommendationService.MentorRecommendation> mentors = 
                    recommendationService.recommendMentors(startupId);
            log.info("✅ Received {} mentors", mentors.size());
            
            log.info("🔄 Calling recommendationService.recommendInvestors()...");
            List<RecommendationService.InvestorRecommendation> investors = 
                    recommendationService.recommendInvestors(startupId);
            log.info("✅ Received {} investors", investors.size());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("startupId", startupId);
            response.put("mentors", mentors);
            response.put("investors", investors);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Failed to get recommendations: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed to get recommendations: " + e.getMessage());
        }
    }

    // ================================================================
    // 5. SEND REQUEST TO MENTOR/INVESTOR
    // ================================================================
    @PostMapping("/send-request")
    public ResponseEntity<?> sendRequest(@RequestBody SendRequestDTO requestDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User founder = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Startup startup = startupRepository.findById(requestDTO.getStartupId())
                    .orElseThrow(() -> new RuntimeException("Startup not found"));
            
            if (!startup.getFounder().getUserId().equals(founder.getUserId())) {
                return ResponseEntity.status(403).body("You don't own this startup");
            }

            User recipient = null;
            Long recipientId = requestDTO.getRecipientId();
            
            log.info("🔍 Looking for recipient with ID: {}", recipientId);
            
            Optional<User> userOpt = userRepository.findById(recipientId);
            if (userOpt.isPresent()) {
                recipient = userOpt.get();
                log.info("✅ Found user directly with ID: {}", recipientId);
            } else {
                log.info("🔄 Trying to find if {} is a mentor_id or investor_id", recipientId);
                
                Optional<MentorProfile> mentorOpt = mentorProfileRepository.findById(recipientId);
                if (mentorOpt.isPresent()) {
                    recipient = mentorOpt.get().getUser();
                    log.info("✅ Found mentor with mentor_id: {} -> user_id: {}", 
                             recipientId, recipient.getUserId());
                } else {
                    Optional<InvestorProfile> investorOpt = investorProfileRepository.findById(recipientId);
                    if (investorOpt.isPresent()) {
                        recipient = investorOpt.get().getUser();
                        log.info("✅ Found investor with investor_id: {} -> user_id: {}", 
                                 recipientId, recipient.getUserId());
                    }
                }
            }
            
            if (recipient == null) {
                return ResponseEntity.badRequest().body("Recipient not found with ID: " + recipientId);
            }

            log.info("📤 Founder {} sending request to {} (User ID: {})", 
                     founder.getName(), recipient.getName(), recipient.getUserId());

            Optional<Request> existing = requestRepository.findByStartupAndRecipient(startup, recipient);
            
            if (existing.isPresent() && existing.get().getStatus() != RequestStatus.REJECTED) {
                return ResponseEntity.badRequest().body("A request already exists for this user");
            }

            Request request = Request.builder()
                    .startup(startup)
                    .founder(founder)
                    .recipient(recipient)
                    .recipientRole(requestDTO.getRecipientRole())
                    .message(requestDTO.getMessage())
                    .status(RequestStatus.PENDING)
                    .permissionGranted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Request saved = requestRepository.save(request);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Request sent successfully to " + recipient.getName(),
                "requestId", saved.getRequestId(),
                "recipientId", recipient.getUserId()
            ));

        } catch (Exception e) {
            log.error("❌ Failed to send request: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed to send request: " + e.getMessage());
        }
    }

    // ================================================================
    // 6. GET ALL REQUESTS
    // ================================================================
    @GetMapping("/requests")
    public ResponseEntity<?> getRequests() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User founder = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Request> requests = requestRepository.findByFounderUserId(founder.getUserId());

            List<Map<String, Object>> response = new ArrayList<>();
            for (Request req : requests) {
                Map<String, Object> map = new HashMap<>();
                map.put("requestId", req.getRequestId());
                map.put("startupId", req.getStartup().getStartupId());
                map.put("startupTitle", req.getStartup().getTitle());
                map.put("recipientId", req.getRecipient().getUserId());
                map.put("recipientName", req.getRecipient().getName());
                map.put("recipientRole", req.getRecipientRole());
                map.put("message", req.getMessage());
                map.put("status", req.getStatus().name());
                map.put("permissionGranted", req.getPermissionGranted());
                map.put("createdAt", req.getCreatedAt());
                map.put("updatedAt", req.getUpdatedAt());
                response.add(map);
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Failed to get requests: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get requests: " + e.getMessage());
        }
    }

    // ================================================================
    // 7. GRANT ACCESS (Upload Private Key & Generate RK)
    // ================================================================
    @PostMapping("/grant-access")
    @Transactional
    public ResponseEntity<?> grantAccess(@RequestBody PrivateKeyUploadDTO requestDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User founder = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Request request = requestRepository.findById(requestDTO.getRequestId())
                    .orElseThrow(() -> new RuntimeException("Request not found"));

            if (!request.getFounder().getUserId().equals(founder.getUserId())) {
                return ResponseEntity.status(403).body("You don't own this request");
            }

            if (request.getStatus() != RequestStatus.ACCEPTED) {
                return ResponseEntity.badRequest().body("Request must be accepted first");
            }

            if (request.getPermissionGranted()) {
                return ResponseEntity.badRequest().body("Access already granted");
            }

            Startup startup = request.getStartup();
            User recipient = request.getRecipient();

            String founderPrivateKey = requestDTO.getPrivateKey();
            if (founderPrivateKey == null || founderPrivateKey.isEmpty()) {
                return ResponseEntity.badRequest().body("Founder's private key is required");
            }

            String recipientPublicKey = recipient.getPublicKey();
            if (recipientPublicKey == null || recipientPublicKey.isEmpty()) {
                return ResponseEntity.badRequest().body("Recipient has no public key");
            }

            try {
                log.info("🔐 Granting PRE access for Founder {} -> Recipient {}", 
                         founder.getUserId(), recipient.getUserId());

                String encryptedAesKey = startup.getEncryptedAesKey();
                log.debug("🔑 Encrypted AES key length: {}", encryptedAesKey.length());

                String aesKeyBase64 = ipfsService.decryptAESKeyWithPrivateKey(
                    encryptedAesKey, 
                    founderPrivateKey
                );
                log.debug("🔑 Decrypted AES key length: {}", aesKeyBase64.length());

                String reEncryptedAesKey = ipfsService.encryptAESKeyWithPublicKey(
                    aesKeyBase64,
                    recipientPublicKey
                );
                log.debug("🔑 Re-encrypted AES key length: {}", reEncryptedAesKey.length());

                ReEncryptionKey reKey = ReEncryptionKey.builder()
                        .request(request)
                        .startup(startup)
                        .user(recipient)
                        .encryptedRk(reEncryptedAesKey)
                        .reEncryptedCid(startup.getIpfsCid())
                        .status("ACTIVE")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                reEncryptionKeyRepository.save(reKey);

                request.setPermissionGranted(true);
                request.setUpdatedAt(LocalDateTime.now());
                requestRepository.save(request);

                String txHash = fabricService.grantAccess(
                        String.valueOf(startup.getStartupId()),
                        String.valueOf(recipient.getUserId()),
                        request.getRecipientRole(),
                        String.valueOf(founder.getUserId())
                );
                request.setBlockchainTxHash(txHash);
                requestRepository.save(request);

                log.info("✅ Access granted successfully with PRE!");

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Access granted successfully with Proxy Re-Encryption!",
                        "requestId", request.getRequestId(),
                        "blockchainTx", txHash
                ));

            } catch (Exception e) {
                log.error("❌ Failed to grant access: {}", e.getMessage());
                return ResponseEntity.badRequest().body("Failed to grant access: " + e.getMessage());
            }

        } catch (Exception e) {
            log.error("❌ Failed to grant access: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed to grant access: " + e.getMessage());
        }
    }

    // ================================================================
    // 8. REVOKE ACCESS
    // ================================================================
    @PostMapping("/revoke-access")
    @Transactional
    public ResponseEntity<?> revokeAccess(@RequestBody Map<String, Long> request) {
        try {
            Long requestId = request.get("requestId");

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User founder = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Request req = requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Request not found"));

            if (!req.getFounder().getUserId().equals(founder.getUserId())) {
                return ResponseEntity.status(403).body("You don't own this request");
            }

            req.setPermissionGranted(false);
            req.setStatus(RequestStatus.REVOKED);
            req.setUpdatedAt(LocalDateTime.now());
            requestRepository.save(req);

            reEncryptionKeyRepository.revokeByStartupAndUser(
                    req.getStartup().getStartupId(),
                    req.getRecipient().getUserId()
            );

            fabricService.revokeAccess(
                    String.valueOf(req.getStartup().getStartupId()),
                    String.valueOf(req.getRecipient().getUserId())
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Access revoked successfully"
            ));

        } catch (Exception e) {
            log.error("❌ Failed to revoke access: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to revoke access: " + e.getMessage());
        }
    }

    // ================================================================
    // 9. GET ACCESS LIST FOR A PROPOSAL
    // ================================================================
    @GetMapping("/proposal/{startupId}/access-list")
    public ResponseEntity<?> getAccessList(@PathVariable Long startupId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User founder = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Startup startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));

            if (!startup.getFounder().getUserId().equals(founder.getUserId())) {
                return ResponseEntity.status(403).body("You don't own this startup");
            }

            List<Request> requests = requestRepository.findByStartup(startup);

            List<Map<String, Object>> accessList = new ArrayList<>();
            for (Request req : requests) {
                if (req.getPermissionGranted()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("requestId", req.getRequestId());
                    map.put("recipientId", req.getRecipient().getUserId());
                    map.put("recipientName", req.getRecipient().getName());
                    map.put("recipientRole", req.getRecipientRole());
                    map.put("grantedAt", req.getUpdatedAt());
                    accessList.add(map);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "count", accessList.size(),
                    "accessList", accessList
            ));

        } catch (Exception e) {
            log.error("❌ Failed to get access list: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get access list: " + e.getMessage());
        }
    }

    // ================================================================
    // 10. UPDATE PROPOSAL WITH DCH
    // ================================================================
    @PutMapping("/update-proposal")
    public ResponseEntity<?> updateProposal(
            HttpServletRequest request,
            @RequestBody UpdateProposalRequest updateRequest) {
        try {
            log.info("📝 Update proposal called for startup: {}", updateRequest.getStartupId());
            
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7);
            Long founderId = jwtUtil.extractUserId(token);

            if (founderId == null) {
                return ResponseEntity.badRequest().body("User ID not found in token");
            }

            Startup updatedStartup = proposalUpdateService.updateProposal(
                    founderId,
                    updateRequest.getStartupId(),
                    updateRequest.getTitle(),
                    updateRequest.getDomain(),
                    updateRequest.getStage(),
                    updateRequest.getFundingAmount(),
                    updateRequest.getSummary(),
                    updateRequest.getKeywords(),
                    updateRequest.getTechnologyStack(),
                    updateRequest.getMentorRequirements(),
                    updateRequest.getInvestorPitch(),
                    updateRequest.getProblemStatement(),
                    updateRequest.getSolution(),
                    updateRequest.getBusinessModel()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Proposal updated successfully with DCH!");
            response.put("startupId", updatedStartup.getStartupId());
            response.put("title", updatedStartup.getTitle());
            response.put("version", updatedStartup.getVersion());
            response.put("status", updatedStartup.getStatus());
            response.put("tMeta", updatedStartup.getTMeta());
            response.put("dchRandomParam", updatedStartup.getDchRandomParam());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Update proposal failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Update failed: " + e.getMessage());
        }
    }
}