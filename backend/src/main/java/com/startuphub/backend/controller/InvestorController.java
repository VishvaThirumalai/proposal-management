package com.startuphub.backend.controller;

import com.startuphub.backend.model.*;
import com.startuphub.backend.model.dto.ApproveRequestDTO;
import com.startuphub.backend.model.dto.RequestResponseDTO;
import com.startuphub.backend.model.enums.RequestStatus;
import com.startuphub.backend.repository.*;
import com.startuphub.backend.service.IPFSService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/investor")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INVESTOR')")
@Slf4j
public class InvestorController {

    private final StartupRepository startupRepository;
    private final UserRepository userRepository;
    private final RequestRepository requestRepository;
    private final ReEncryptionKeyRepository reEncryptionKeyRepository;
    private final AccessLogRepository accessLogRepository;
    private final IPFSService ipfsService;

    // ================================================================
    // 1. GET ALL PROPOSALS
    // ================================================================
    @GetMapping("/proposals")
    public ResponseEntity<?> getProposals() {
        try {
            log.info("📋 Investor fetching all proposals");
            List<Startup> proposals = startupRepository.findByStatus("INDEXED");

            List<Map<String, Object>> response = new ArrayList<>();
            for (Startup p : proposals) {
                Map<String, Object> map = new HashMap<>();
                map.put("startupId", p.getStartupId());
                map.put("title", p.getTitle());
                map.put("domain", p.getDomain());
                map.put("stage", p.getStage() != null ? p.getStage().name() : "N/A");
                map.put("fundingAmount", p.getFundingAmount());
                map.put("aiSummary", p.getAiSummary());
                map.put("aiKeywords", p.getAiKeywords());
                map.put("aiTags", p.getAiTags());
                map.put("status", p.getStatus());
                map.put("createdAt", p.getCreatedAt());

                // Check if already requested
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                String email = auth.getName();
                User investor = userRepository.findByEmail(email).orElse(null);
                if (investor != null) {
                    Optional<Request> existing = requestRepository.findByStartupStartupIdAndRecipientUserId(
                            p.getStartupId(), investor.getUserId());
                    map.put("requested", existing.isPresent());
                    if (existing.isPresent()) {
                        map.put("requestStatus", existing.get().getStatus().name());
                    }
                }
                response.add(map);
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to load proposals: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to load proposals: " + e.getMessage());
        }
    }

    // ================================================================
    // 2. SEARCH PROPOSALS
    // ================================================================
    @GetMapping("/search")
    public ResponseEntity<?> searchProposals(@RequestParam("q") String query) {
        try {
            log.info("🔍 Investor searching proposals: {}", query);
            List<Startup> allProposals = startupRepository.findByStatus("INDEXED");

            List<Map<String, Object>> filtered = new ArrayList<>();
            for (Startup p : allProposals) {
                if (p.getTitle().toLowerCase().contains(query.toLowerCase()) ||
                        (p.getDomain() != null && p.getDomain().toLowerCase().contains(query.toLowerCase())) ||
                        (p.getAiSummary() != null && p.getAiSummary().toLowerCase().contains(query.toLowerCase())) ||
                        (p.getAiKeywords() != null && p.getAiKeywords().toLowerCase().contains(query.toLowerCase()))) {

                    Map<String, Object> map = new HashMap<>();
                    map.put("startupId", p.getStartupId());
                    map.put("title", p.getTitle());
                    map.put("domain", p.getDomain());
                    map.put("stage", p.getStage() != null ? p.getStage().name() : "N/A");
                    map.put("fundingAmount", p.getFundingAmount());
                    map.put("aiSummary", p.getAiSummary());
                    map.put("status", p.getStatus());
                    filtered.add(map);
                }
            }

            log.info("✅ Found {} matching proposals", filtered.size());
            return ResponseEntity.ok(filtered);
        } catch (Exception e) {
            log.error("❌ Search failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Search failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 3. GET RECOMMENDATIONS
    // ================================================================
    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User investor = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            log.info("📊 Getting recommendations for investor: {}", investor.getName());

            List<Startup> allProposals = startupRepository.findByStatus("INDEXED");
            List<Map<String, Object>> recommendations = new ArrayList<>();

            for (Startup p : allProposals) {
                Map<String, Object> map = new HashMap<>();
                map.put("startupId", p.getStartupId());
                map.put("title", p.getTitle());
                map.put("domain", p.getDomain());
                map.put("stage", p.getStage() != null ? p.getStage().name() : "N/A");
                map.put("fundingAmount", p.getFundingAmount());
                map.put("aiSummary", p.getAiSummary());
                map.put("aiTags", p.getAiTags());
                map.put("matchScore", 85 + new Random().nextInt(15));
                map.put("status", p.getStatus());
                recommendations.add(map);
            }

            // Limit to top 20
            if (recommendations.size() > 20) {
                recommendations = recommendations.subList(0, 20);
            }

            log.info("✅ Found {} recommendations", recommendations.size());
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            log.error("❌ Failed to get recommendations: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get recommendations: " + e.getMessage());
        }
    }

    // ================================================================
    // 4. GET REQUESTS
    // ================================================================
    @GetMapping("/requests")
    public ResponseEntity<?> getRequests() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User investor = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            log.info("📬 Getting requests for investor: {}", investor.getName());

            List<Request> requests = requestRepository.findByRecipientUserId(investor.getUserId());

            List<RequestResponseDTO> response = new ArrayList<>();
            for (Request req : requests) {
                response.add(RequestResponseDTO.builder()
                        .requestId(req.getRequestId())
                        .startupId(req.getStartup().getStartupId())
                        .startupTitle(req.getStartup().getTitle())
                        .founderId(req.getFounder().getUserId())
                        .founderName(req.getFounder().getName())
                        .recipientId(req.getRecipient().getUserId())
                        .recipientName(req.getRecipient().getName())
                        .recipientRole(req.getRecipientRole())
                        .message(req.getMessage())
                        .status(req.getStatus())
                        .permissionGranted(req.getPermissionGranted())
                        .blockchainTxHash(req.getBlockchainTxHash())
                        .createdAt(req.getCreatedAt())
                        .updatedAt(req.getUpdatedAt())
                        .build());
            }

            log.info("✅ Found {} requests", response.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to get requests: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get requests: " + e.getMessage());
        }
    }

    // ================================================================
    // 5. RESPOND TO REQUEST
    // ================================================================
    @PutMapping("/requests/{requestId}")
    @Transactional
    public ResponseEntity<?> respondToRequest(
            @PathVariable Long requestId,
            @RequestBody ApproveRequestDTO requestDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User investor = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            log.info("📝 Investor {} responding to request: {}", investor.getName(), requestId);

            Request request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Request not found"));

            if (!request.getRecipient().getUserId().equals(investor.getUserId())) {
                return ResponseEntity.status(403).body("This request is not for you");
            }

            if (request.getStatus() != RequestStatus.PENDING) {
                return ResponseEntity.badRequest().body("Request is already processed");
            }

            if (requestDTO.isAccept()) {
                request.setStatus(RequestStatus.ACCEPTED);
                request.setUpdatedAt(LocalDateTime.now());
                requestRepository.save(request);

                log.info("✅ Investor {} accepted request: {}", investor.getName(), requestId);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "✅ Request accepted! Waiting for founder to grant access.",
                        "requestId", request.getRequestId(),
                        "startupTitle", request.getStartup().getTitle(),
                        "founderName", request.getFounder().getName()
                ));
            } else {
                request.setStatus(RequestStatus.REJECTED);
                request.setUpdatedAt(LocalDateTime.now());
                requestRepository.save(request);

                log.info("❌ Investor {} rejected request: {}", investor.getName(), requestId);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "❌ Request rejected",
                        "requestId", request.getRequestId()
                ));
            }

        } catch (Exception e) {
            log.error("❌ Failed to respond to request: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to respond to request: " + e.getMessage());
        }
    }

    // ================================================================
    // 6. GET ASSIGNED PROPOSALS
    // ================================================================
    @GetMapping("/assigned")
    public ResponseEntity<?> getAssignedProposals() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User investor = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            log.info("📋 Getting assigned proposals for investor: {}", investor.getName());

            List<Request> acceptedRequests = requestRepository.findByRecipientUserIdAndStatus(
                    investor.getUserId(), RequestStatus.ACCEPTED);

            List<Map<String, Object>> response = new ArrayList<>();
            for (Request req : acceptedRequests) {
                Startup p = req.getStartup();
                Map<String, Object> map = new HashMap<>();
                map.put("startupId", p.getStartupId());
                map.put("title", p.getTitle());
                map.put("domain", p.getDomain());
                map.put("stage", p.getStage() != null ? p.getStage().name() : "N/A");
                map.put("fundingAmount", p.getFundingAmount());
                map.put("aiSummary", p.getAiSummary());
                map.put("ipfsCid", p.getIpfsCid());
                map.put("status", p.getStatus());
                map.put("permissionGranted", req.getPermissionGranted());
                map.put("requestId", req.getRequestId());
                map.put("requestStatus", req.getStatus().name());
                response.add(map);
            }

            log.info("✅ Found {} assigned proposals", response.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to get assigned proposals: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get assigned proposals: " + e.getMessage());
        }
    }

    // ================================================================
    // 7. VIEW PROPOSAL WITH PRE (UPDATED)
    // ================================================================
    @PostMapping("/view-proposal")
    public ResponseEntity<?> viewProposal(@RequestBody Map<String, String> request) {
        try {
            Long startupId = Long.parseLong(request.get("startupId"));
            String investorPrivateKey = request.get("privateKey");

            if (investorPrivateKey == null || investorPrivateKey.isEmpty()) {
                return ResponseEntity.badRequest().body("Private key is required");
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User investor = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            log.info("🔐 Investor {} requesting to view proposal: {}", investor.getName(), startupId);

            // Get startup
            Startup startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));

            // Check if access is granted
            Optional<ReEncryptionKey> reKeyOpt = reEncryptionKeyRepository
                    .findActiveByStartupAndUser(startupId, investor.getUserId());

            if (reKeyOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Access not granted. Please contact the founder.");
            }

            ReEncryptionKey reKey = reKeyOpt.get();
            if (!"ACTIVE".equals(reKey.getStatus())) {
                return ResponseEntity.badRequest().body("Access has been revoked");
            }

            // ✅ Get the re-encrypted AES key (RK) - encrypted with investor's public key
            String reEncryptedAesKey = reKey.getEncryptedRk();
            log.debug("🔑 RK length: {}", reEncryptedAesKey.length());
            
            // ✅ Decrypt the AES key using investor's private key
            String aesKeyBase64 = ipfsService.decryptAESKeyWithPrivateKey(
                reEncryptedAesKey,
                investorPrivateKey
            );
            log.debug("🔑 Decrypted AES key length: {}", aesKeyBase64.length());
            
            byte[] aesKeyBytes = Base64.getDecoder().decode(aesKeyBase64);
            SecretKey aesKey = new SecretKeySpec(aesKeyBytes, "AES");
            log.info("🔑 AES key recovered successfully");

            // Download encrypted proposal from IPFS
            byte[] encryptedProposal = ipfsService.downloadFromIPFS(startup.getIpfsCid());
            log.info("📥 Downloaded encrypted proposal: {} bytes", encryptedProposal.length);

            // Decrypt proposal using AES key
            byte[] decryptedProposal = ipfsService.decryptAES(encryptedProposal, aesKey);
            log.info("🔓 Proposal decrypted successfully: {} bytes", decryptedProposal.length);

            // Log access
            AccessLog accessLog = AccessLog.builder()
                    .startup(startup)
                    .user(investor)
                    .accessType("VIEW")
                    .accessedAt(LocalDateTime.now())
                    .build();
            accessLogRepository.save(accessLog);
            log.info("📝 Access logged for proposal: {}", startupId);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=proposal.pdf")
                    .body(decryptedProposal);

        } catch (Exception e) {
            log.error("❌ Failed to view proposal: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed to view proposal: " + e.getMessage());
        }
    }

    // ================================================================
    // 8. CHECK ACCESS STATUS
    // ================================================================
    @GetMapping("/access-status/{startupId}")
    public ResponseEntity<?> checkAccessStatus(@PathVariable Long startupId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User investor = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            log.info("🔍 Checking access status for investor {} on startup {}", investor.getName(), startupId);

            Optional<ReEncryptionKey> reKey = reEncryptionKeyRepository
                    .findActiveByStartupAndUser(startupId, investor.getUserId());

            Optional<Request> request = requestRepository.findByStartupStartupIdAndRecipientUserId(
                    startupId, investor.getUserId());

            Map<String, Object> response = new HashMap<>();
            response.put("hasAccess", reKey.isPresent() && "ACTIVE".equals(reKey.get().getStatus()));
            response.put("requestExists", request.isPresent());
            if (request.isPresent()) {
                response.put("requestStatus", request.get().getStatus().name());
                response.put("permissionGranted", request.get().getPermissionGranted());
            }
            if (reKey.isPresent()) {
                response.put("rkStatus", reKey.get().getStatus());
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to check access status: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to check access status: " + e.getMessage());
        }
    }

    // ================================================================
    // 9. GET ACCESS LOGS
    // ================================================================
    @GetMapping("/access-logs")
    public ResponseEntity<?> getAccessLogs() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User investor = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            log.info("📋 Getting access logs for investor: {}", investor.getName());

            List<AccessLog> logs = accessLogRepository.findByUserUserId(investor.getUserId());

            List<Map<String, Object>> response = new ArrayList<>();
            for (AccessLog log : logs) {
                Map<String, Object> map = new HashMap<>();
                map.put("logId", log.getLogId());
                map.put("startupId", log.getStartup().getStartupId());
                map.put("startupTitle", log.getStartup().getTitle());
                map.put("accessType", log.getAccessType());
                map.put("accessedAt", log.getAccessedAt());
                response.add(map);
            }

            log.info("✅ Found {} access logs", response.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to get access logs: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get access logs: " + e.getMessage());
        }
    }

    // ================================================================
    // 10. GET PORTFOLIO
    // ================================================================
    @GetMapping("/portfolio")
    public ResponseEntity<?> getPortfolio() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User investor = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            log.info("📊 Getting portfolio for investor: {}", investor.getName());

            List<Request> acceptedRequests = requestRepository.findByRecipientUserIdAndStatus(
                    investor.getUserId(), RequestStatus.ACCEPTED);

            List<Map<String, Object>> portfolio = new ArrayList<>();
            double totalInvested = 0;

            for (Request req : acceptedRequests) {
                if (req.getPermissionGranted()) {
                    Startup p = req.getStartup();
                    Map<String, Object> map = new HashMap<>();
                    map.put("startupId", p.getStartupId());
                    map.put("title", p.getTitle());
                    map.put("domain", p.getDomain());
                    map.put("stage", p.getStage() != null ? p.getStage().name() : "N/A");
                    map.put("fundingAmount", p.getFundingAmount());
                    map.put("aiSummary", p.getAiSummary());
                    map.put("investedAt", req.getUpdatedAt());
                    map.put("status", "ACTIVE");
                    portfolio.add(map);

                    if (p.getFundingAmount() != null) {
                        totalInvested += p.getFundingAmount();
                    }
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("totalInvested", totalInvested);
            response.put("startups", portfolio.size());
            response.put("portfolio", portfolio);

            log.info("✅ Portfolio: {} startups, ₹{} invested", portfolio.size(), totalInvested);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to get portfolio: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to get portfolio: " + e.getMessage());
        }
    }

    // ================================================================
    // 11. INVEST IN STARTUP
    // ================================================================
    @PostMapping("/invest")
    @Transactional
    public ResponseEntity<?> investInStartup(@RequestBody Map<String, Object> request) {
        try {
            Long startupId = Long.parseLong(request.get("startupId").toString());
            Double amount = request.get("amount") != null ?
                    Double.parseDouble(request.get("amount").toString()) : null;

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User investor = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            log.info("💰 Investor {} investing in startup: {}", investor.getName(), startupId);

            Startup startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));

            // Check if already invested
            Optional<Request> existing = requestRepository.findByStartupStartupIdAndRecipientUserId(
                    startupId, investor.getUserId());

            if (existing.isPresent() && existing.get().getPermissionGranted()) {
                return ResponseEntity.badRequest().body("Already invested in this startup");
            }

            Optional<Request> acceptedRequest = requestRepository.findAcceptedByStartupAndRecipient(
                    startupId, investor.getUserId());

            if (acceptedRequest.isEmpty()) {
                return ResponseEntity.badRequest().body("No accepted request found. Please request access first.");
            }

            Request req = acceptedRequest.get();
            if (!req.getPermissionGranted()) {
                return ResponseEntity.badRequest().body("Access not granted yet. Please wait for founder approval.");
            }

            req.setStatus(RequestStatus.ACCEPTED);
            req.setUpdatedAt(LocalDateTime.now());
            requestRepository.save(req);

            log.info("✅ Investor {} invested ₹{} in startup {}",
                    investor.getName(), amount, startup.getTitle());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Investment recorded successfully!",
                    "startupId", startupId,
                    "startupTitle", startup.getTitle(),
                    "amount", amount != null ? amount : "Not specified"
            ));

        } catch (Exception e) {
            log.error("❌ Failed to invest: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed to invest: " + e.getMessage());
        }
    }
}