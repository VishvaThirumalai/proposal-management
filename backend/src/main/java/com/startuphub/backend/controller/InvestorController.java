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
    private final EscrowRepository escrowRepository;
    private final EscrowMilestoneRepository escrowMilestoneRepository;
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

                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                User investor = userRepository.findByEmail(auth.getName()).orElse(null);
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

            return ResponseEntity.ok(filtered);
        } catch (Exception e) {
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
            User investor = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

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

            if (recommendations.size() > 20) {
                recommendations = recommendations.subList(0, 20);
            }

            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 4. GET REQUESTS
    // ================================================================
    @GetMapping("/requests")
    public ResponseEntity<?> getRequests() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User investor = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

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

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
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
            User investor = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

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

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "✅ Request accepted! Waiting for founder to grant access.",
                        "requestId", request.getRequestId()
                ));
            } else {
                request.setStatus(RequestStatus.REJECTED);
                request.setUpdatedAt(LocalDateTime.now());
                requestRepository.save(request);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "❌ Request rejected",
                        "requestId", request.getRequestId()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 6. GET ASSIGNED PROPOSALS
    // ================================================================
    @GetMapping("/assigned")
    public ResponseEntity<?> getAssignedProposals() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User investor = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

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

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 7. VIEW PROPOSAL (PRE)
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
            User investor = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            Startup startup = startupRepository.findById(startupId)
                    .orElseThrow(() -> new RuntimeException("Startup not found"));

            Optional<ReEncryptionKey> reKeyOpt = reEncryptionKeyRepository
                    .findActiveByStartupAndUser(startupId, investor.getUserId());

            if (reKeyOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Access not granted. Please contact the founder.");
            }

            ReEncryptionKey reKey = reKeyOpt.get();
            if (!"ACTIVE".equals(reKey.getStatus())) {
                return ResponseEntity.badRequest().body("Access has been revoked");
            }

            String reEncryptedAesKey = reKey.getEncryptedRk();

            String aesKeyBase64 = ipfsService.decryptAESKeyWithPrivateKey(
                    reEncryptedAesKey,
                    investorPrivateKey
            );

            byte[] aesKeyBytes = Base64.getDecoder().decode(aesKeyBase64);
            SecretKey aesKey = new SecretKeySpec(aesKeyBytes, "AES");

            byte[] encryptedProposal = ipfsService.downloadFromIPFS(startup.getIpfsCid());
            byte[] decryptedProposal = ipfsService.decryptAES(encryptedProposal, aesKey);

            AccessLog accessLog = AccessLog.builder()
                    .startup(startup)
                    .user(investor)
                    .accessType("VIEW")
                    .accessedAt(LocalDateTime.now())
                    .build();
            accessLogRepository.save(accessLog);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=proposal.pdf")
                    .body(decryptedProposal);
        } catch (Exception e) {
            log.error("❌ Failed to view proposal: {}", e.getMessage());
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
            User investor = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

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
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 9. GET ACCESS LOGS
    // ================================================================
    @GetMapping("/access-logs")
    public ResponseEntity<?> getAccessLogs() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User investor = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

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

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 10. GET PORTFOLIO
    // ================================================================
    @GetMapping("/portfolio")
    public ResponseEntity<?> getPortfolio() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User investor = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            // Get all escrows by this investor
            List<Escrow> escrows = escrowRepository.findByInvestorId(investor.getUserId());

            List<Map<String, Object>> portfolio = new ArrayList<>();
            double totalInvested = 0;
            double totalReleased = 0;

            for (Escrow escrow : escrows) {
                Map<String, Object> map = new HashMap<>();
                map.put("escrowId", escrow.getEscrowId());
                map.put("startupId", escrow.getStartupId());
                map.put("totalAmount", escrow.getTotalAmount());
                map.put("releasedAmount", escrow.getReleasedAmount());
                map.put("status", escrow.getStatus());
                map.put("createdAt", escrow.getCreatedAt());
                portfolio.add(map);

                totalInvested += escrow.getTotalAmount() != null ? escrow.getTotalAmount() : 0;
                totalReleased += escrow.getReleasedAmount() != null ? escrow.getReleasedAmount() : 0;
            }

            Map<String, Object> response = new HashMap<>();
            response.put("totalInvested", totalInvested);
            response.put("totalReleased", totalReleased);
            response.put("startups", escrows.size());
            response.put("portfolio", portfolio);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 11. ✅ NEW: GET INVESTED PROPOSALS (based on escrows, not flags)
    // ================================================================
    @GetMapping("/invested")
    public ResponseEntity<?> getInvestedProposals() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User investor = userRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("Investor not found"));

            // Fetch escrows for this investor (these represent "investments")
            List<Escrow> escrows = escrowRepository.findByInvestorId(investor.getUserId());

            List<Map<String, Object>> investedProposals = new ArrayList<>();

            for (Escrow escrow : escrows) {
                Startup p = startupRepository.findById(escrow.getStartupId()).orElse(null);
                if (p == null) continue;

                Map<String, Object> map = new HashMap<>();
                map.put("escrowId", escrow.getEscrowId());
                map.put("startupId", p.getStartupId());
                map.put("title", p.getTitle());
                map.put("domain", p.getDomain());
                map.put("stage", p.getStage() != null ? p.getStage().name() : "N/A");
                map.put("fundingAmount", escrow.getTotalAmount());
                map.put("releasedAmount", escrow.getReleasedAmount());
                map.put("aiSummary", p.getAiSummary());
                map.put("ipfsCid", p.getIpfsCid());
                map.put("status", escrow.getStatus());
                map.put("escrowStatus", escrow.getStatus());
                map.put("createdAt", escrow.getCreatedAt());

                // Include milestone summary
                List<EscrowMilestone> milestones = escrowMilestoneRepository.findByEscrowId(escrow.getEscrowId());
                map.put("totalMilestones", milestones.size());
                map.put("approvedMilestones", milestones.stream()
                        .filter(m -> "APPROVED".equals(m.getStatus()) || "RELEASED".equals(m.getStatus()))
                        .count());

                investedProposals.add(map);
            }

            return ResponseEntity.ok(investedProposals);
        } catch (Exception e) {
            log.error("❌ Failed to get invested proposals: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // 12. ✅ DEPRECATED: Old invest endpoint
    //     Now redirects to escrow creation flow
    // ================================================================
    @PostMapping("/invest")
    @Deprecated
    public ResponseEntity<?> investInStartup(@RequestBody Map<String, Object> request) {
        // This endpoint is deprecated.
        // Investors should now create milestone escrows instead.
        return ResponseEntity.badRequest().body(
                "Direct investment is deprecated. Please create a Milestone Escrow instead: POST /escrow/create"
        );
    }
}