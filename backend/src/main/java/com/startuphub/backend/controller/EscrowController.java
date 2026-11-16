package com.startuphub.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.model.User;
import com.startuphub.backend.model.dto.EscrowRequestDTO;
import com.startuphub.backend.model.dto.EscrowResponseDTO;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.service.EscrowService;
import com.startuphub.backend.service.FabricService;
import com.startuphub.backend.service.IPFSService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/escrow")
@RequiredArgsConstructor
@Slf4j
public class EscrowController {

    private final EscrowService escrowService;
    private final FabricService fabricService;
    private final IPFSService ipfsService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ================================================================
    // INVESTOR: Create Escrow
    // ================================================================
    @PostMapping("/create")
    @PreAuthorize("hasRole('INVESTOR')")
    public ResponseEntity<?> createEscrow(@RequestBody EscrowRequestDTO dto) {
        try {
            log.info("📝 Create escrow request: {}", dto);

            String milestonesJson = objectMapper.writeValueAsString(dto.getMilestones());
            String approversJson = objectMapper.writeValueAsString(dto.getApprovers());
            String escrowId = "ESC_" + System.currentTimeMillis();

            String txHash = fabricService.createEscrow(
                    escrowId,
                    dto.getStartupId(),
                    dto.getInvestorId(),
                    dto.getFounderId(),
                    String.valueOf(dto.getTotalAmount()),
                    milestonesJson,
                    approversJson
            );

            escrowService.createEscrow(dto, escrowId, txHash);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "escrowId", escrowId,
                    "txHash", txHash,
                    "message", "Escrow created and funds locked"
            ));
        } catch (Exception e) {
            log.error("❌ Create escrow failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // FOUNDER: Submit milestone proof  ← SYNC #1 HERE
    // ================================================================
    @PostMapping(value = "/submit-proof", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('FOUNDER')")
    public ResponseEntity<?> submitProof(
            @RequestParam("escrowId") String escrowId,
            @RequestParam("milestoneId") String milestoneId,
            @RequestParam("proofFile") MultipartFile proofFile,
            @RequestParam("proofNotes") String proofNotes,
            Authentication auth) {
        try {
            String email = auth.getName();
            User founder = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            String founderId = String.valueOf(founder.getUserId());

            String proofCid = ipfsService.uploadToIPFS(proofFile);

            // 1. Blockchain first
            String txHash = fabricService.submitMilestoneProof(
                    escrowId, milestoneId, proofCid, proofNotes, founderId);

            // 2. ✅ SYNC MySQL from blockchain
            String escrowJson = fabricService.getEscrow(escrowId);
            escrowService.syncFromBlockchain(escrowId, escrowJson);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "proofCid", proofCid,
                    "txHash", txHash
            ));
        } catch (Exception e) {
            log.error("❌ Submit proof failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // INVESTOR/MENTOR: Approve milestone  ← SYNC #2 HERE
    // ================================================================
    @PostMapping("/approve")
    public ResponseEntity<?> approveMilestone(
            @RequestBody Map<String, String> request,
            Authentication auth) {
        try {
            String escrowId = request.get("escrowId");
            String milestoneId = request.get("milestoneId");

            String email = auth.getName();
            User approver = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            String approverId = String.valueOf(approver.getUserId());

            log.info("✅ Approving milestone: {} / {} by user ID {}",
                    escrowId, milestoneId, approverId);

            // 1. Blockchain first
            String txHash = fabricService.approveMilestone(
                    escrowId, milestoneId, approverId);

            // 2. ✅ SYNC MySQL from blockchain
            String escrowJson = fabricService.getEscrow(escrowId);
            escrowService.syncFromBlockchain(escrowId, escrowJson);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "txHash", txHash,
                    "message", "Milestone approved"
            ));
        } catch (Exception e) {
            log.error("❌ Approve failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // INVESTOR/MENTOR: Reject milestone  ← SYNC #3 HERE
    // ================================================================
    @PostMapping("/reject")
    public ResponseEntity<?> rejectMilestone(
            @RequestBody Map<String, String> request,
            Authentication auth) {
        try {
            String escrowId = request.get("escrowId");
            String milestoneId = request.get("milestoneId");
            String reason = request.get("reason");

            String email = auth.getName();
            User rejector = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            String rejectorId = String.valueOf(rejector.getUserId());

            log.info("❌ Rejecting milestone: {} / {} by user ID {}",
                    escrowId, milestoneId, rejectorId);

            // 1. Blockchain first
            String txHash = fabricService.rejectMilestone(
                    escrowId, milestoneId, rejectorId, reason);

            // 2. ✅ SYNC MySQL from blockchain
            String escrowJson = fabricService.getEscrow(escrowId);
            escrowService.syncFromBlockchain(escrowId, escrowJson);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "txHash", txHash,
                    "message", "Milestone rejected"
            ));
        } catch (Exception e) {
            log.error("❌ Reject failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // RELEASE FUNDS  ← SYNC #4 HERE
    // ================================================================
    @PostMapping("/release-funds")
    @PreAuthorize("hasAnyRole('INVESTOR', 'MENTOR')")
    public ResponseEntity<?> releaseMilestoneFunds(
            @RequestBody Map<String, String> request,
            Authentication auth) {
        try {
            String escrowId = request.get("escrowId");
            String milestoneId = request.get("milestoneId");

            log.info("💰 Releasing funds: {} / {}", escrowId, milestoneId);

            // 1. Blockchain first
            String txHash = fabricService.releaseMilestoneFunds(escrowId, milestoneId);

            // 2. ✅ SYNC MySQL from blockchain
            String escrowJson = fabricService.getEscrow(escrowId);
            escrowService.syncFromBlockchain(escrowId, escrowJson);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "txHash", txHash,
                    "message", "Funds released successfully"
            ));
        } catch (Exception e) {
            log.error("❌ Release funds failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // READ: Get escrow by ID
    // ================================================================
    @GetMapping("/{escrowId}")
    public ResponseEntity<?> getEscrow(@PathVariable String escrowId) {
        try {
            log.info("📋 Getting escrow details: {}", escrowId);

            // ✅ Read from blockchain FIRST (source of truth)
            try {
                String result = fabricService.getEscrow(escrowId);
                if (result != null && !result.isEmpty() && !result.equals("[]")) {
                    // Sync MySQL in background
                    try {
                        escrowService.syncFromBlockchain(escrowId, result);
                    } catch (Exception syncEx) {
                        log.warn("Sync failed: {}", syncEx.getMessage());
                    }
                    return ResponseEntity.ok(result);
                }
            } catch (Exception blockchainEx) {
                log.warn("Blockchain get failed, using MySQL: {}", blockchainEx.getMessage());
            }

            // Fallback to MySQL
            EscrowResponseDTO dto = escrowService.getEscrowDTO(escrowId);
            if (dto != null) {
                return ResponseEntity.ok(dto);
            }

            return ResponseEntity.status(404).body("Escrow not found: " + escrowId);

        } catch (Exception e) {
            log.error("❌ Failed to get escrow: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // READ: Get escrows by startup
    // ================================================================
    @GetMapping("/startup/{startupId}")
    public ResponseEntity<?> getEscrowsByStartup(@PathVariable String startupId) {
        try {
            String result = fabricService.getEscrowsByStartup(startupId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            try {
                Long id = Long.parseLong(startupId.replace("PROP_", ""));
                return ResponseEntity.ok(escrowService.getEscrowsByStartup(id));
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
            }
        }
    }

    // ================================================================
    // INVESTOR: Get my escrows
    // ================================================================
    @GetMapping("/my-escrows/investor")
    @PreAuthorize("hasRole('INVESTOR')")
    public ResponseEntity<?> getMyEscrowsAsInvestor(Authentication auth) {
        try {
            String email = auth.getName();
            log.info("📋 Getting escrows for investor: {}", email);
            List<EscrowResponseDTO> escrows = escrowService.getEscrowsByInvestorEmail(email);
            return ResponseEntity.ok(escrows);
        } catch (Exception e) {
            log.error("❌ Failed to get investor escrows: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }

    // ================================================================
    // FOUNDER: Get my escrows
    // ================================================================
    @GetMapping("/my-escrows/founder")
    @PreAuthorize("hasRole('FOUNDER')")
    public ResponseEntity<?> getMyEscrowsAsFounder(Authentication auth) {
        try {
            String email = auth.getName();
            log.info("📋 Getting escrows for founder: {}", email);
            List<EscrowResponseDTO> escrows = escrowService.getEscrowsByFounderEmail(email);
            return ResponseEntity.ok(escrows);
        } catch (Exception e) {
            log.error("❌ Failed to get founder escrows: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Failed: " + e.getMessage());
        }
    }
}