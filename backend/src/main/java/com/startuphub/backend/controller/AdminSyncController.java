package com.startuphub.backend.controller;

import com.startuphub.backend.model.*;
import com.startuphub.backend.repository.*;
import com.startuphub.backend.service.FabricService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/admin/sync")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminSyncController {

    private final StartupRepository startupRepository;
    private final EscrowRepository escrowRepository;
    private final EscrowMilestoneRepository milestoneRepository;
    private final RequestRepository requestRepository;
    private final FabricService fabricService;

    // ================================================================
    // SYNC ALL PROPOSALS
    // ================================================================
    @PostMapping("/proposals")
    public ResponseEntity<?> syncAllProposals() {
        log.info("🔄 Syncing proposals...");
        
        List<Startup> startups = startupRepository.findAll();
        int synced = 0, skipped = 0, failed = 0;
        List<String> errors = new ArrayList<>();

        for (Startup s : startups) {
            if (s.getIpfsCid() == null || s.getIpfsCid().isEmpty()) {
                skipped++;
                continue;
            }

            String proposalId = "PROP_" + s.getStartupId();
            
            try {
                // ✅ Check if exists first
                boolean exists = checkProposalExists(proposalId);
                if (exists) {
                    skipped++;
                    log.info("⏭️ Skipping existing proposal: {}", proposalId);
                    continue;
                }

                fabricService.createProposal(
                        proposalId,
                        String.valueOf(s.getFounder().getUserId()),
                        safe(s.getTitle()),
                        safe(s.getDomain()),
                        s.getStage() != null ? s.getStage().name() : "IDEA",
                        String.valueOf(s.getFundingAmount() != null ? s.getFundingAmount() : 0),
                        safe(s.getIpfsCid()),
                        safe(s.getSha256Hash()),
                        safe(s.getTMeta()),
                        safe(s.getAiSummary()),
                        safe(s.getAiKeywords()),
                        safe(s.getAiTechnologyStack()),
                        safe(s.getAiMentorRequirements()),
                        safe(s.getAiInvestorPitch()),
                        safe(s.getAiProblemStatement()),
                        safe(s.getAiSolution()),
                        safe(s.getAiBusinessModel())
                );
                synced++;
                log.info("✅ Synced proposal: {}", proposalId);
            } catch (Exception e) {
                failed++;
                errors.add(proposalId + ": " + e.getMessage());
                log.error("❌ Failed {}: {}", proposalId, e.getMessage());
            }
        }

        return ResponseEntity.ok(buildResult(synced, skipped, failed, errors));
    }

    // ================================================================
    // SYNC ALL ESCROWS
    // ================================================================
    @PostMapping("/escrows")
    public ResponseEntity<?> syncAllEscrows() {
        log.info("🔄 Syncing escrows...");
        
        List<Escrow> escrows = escrowRepository.findAll();
        int synced = 0, skipped = 0, failed = 0;
        List<String> errors = new ArrayList<>();

        for (Escrow e : escrows) {
            try {
                // ✅ Check if exists first
                boolean exists = checkEscrowExists(e.getEscrowId());
                if (exists) {
                    skipped++;
                    log.info("⏭️ Skipping existing escrow: {}", e.getEscrowId());
                    continue;
                }

                // Build milestones JSON
                List<EscrowMilestone> milestones = 
                    milestoneRepository.findByEscrowId(e.getEscrowId());

                StringBuilder milestonesJson = new StringBuilder("[");
                for (int i = 0; i < milestones.size(); i++) {
                    EscrowMilestone m = milestones.get(i);
                    if (i > 0) milestonesJson.append(",");
                    milestonesJson.append("{")
                            .append("\"milestoneId\":\"").append(m.getMilestoneId()).append("\",")
                            .append("\"description\":\"").append(escapeJson(m.getDescription())).append("\",")
                            .append("\"amount\":").append(m.getAmount()).append(",")
                            .append("\"dueDate\":\"").append(safe(m.getDueDate())).append("\",")
                            .append("\"status\":\"").append(m.getStatus()).append("\"")
                            .append("}");
                }
                milestonesJson.append("]");

                String approversJson = (e.getApprovers() != null && !e.getApprovers().isEmpty())
                        ? e.getApprovers()
                        : "[\"111\",\"MENTOR_12\"]";

                fabricService.createEscrow(
                        e.getEscrowId(),
                        String.valueOf(e.getStartupId()),
                        String.valueOf(e.getInvestorId()),
                        String.valueOf(e.getFounderId()),
                        String.valueOf(e.getTotalAmount()),
                        milestonesJson.toString(),
                        approversJson
                );
                synced++;
                log.info("✅ Synced escrow: {}", e.getEscrowId());
            } catch (Exception ex) {
                failed++;
                errors.add(e.getEscrowId() + ": " + ex.getMessage());
                log.error("❌ Failed {}: {}", e.getEscrowId(), ex.getMessage());
            }
        }

        return ResponseEntity.ok(buildResult(synced, skipped, failed, errors));
    }

    // ================================================================
    // SYNC ACCESS PERMISSIONS
    // ================================================================
    @PostMapping("/access-permissions")
    public ResponseEntity<?> syncAccessPermissions() {
        log.info("🔄 Syncing access permissions...");
        
        List<Request> requests = requestRepository.findAll();
        int synced = 0, skipped = 0, failed = 0;
        List<String> errors = new ArrayList<>();

        for (Request r : requests) {
            if (!Boolean.TRUE.equals(r.getPermissionGranted())) {
                skipped++;
                continue;
            }

            try {
                String proposalId = "PROP_" + r.getStartup().getStartupId();
                String userId = String.valueOf(r.getRecipient().getUserId());

                // ✅ Check if permission already exists
                boolean exists = checkPermissionExists(proposalId, userId);
                if (exists) {
                    skipped++;
                    log.info("⏭️ Skipping existing permission: {} -> {}", proposalId, userId);
                    continue;
                }

                fabricService.grantAccess(
                        proposalId,
                        userId,
                        r.getRecipientRole(),
                        String.valueOf(r.getFounder().getUserId())
                );
                synced++;
                log.info("✅ Synced permission: {} -> {}", proposalId, userId);
            } catch (Exception ex) {
                failed++;
                errors.add("Request " + r.getRequestId() + ": " + ex.getMessage());
                log.error("❌ Failed request {}: {}", r.getRequestId(), ex.getMessage());
            }
        }

        return ResponseEntity.ok(buildResult(synced, skipped, failed, errors));
    }

    // ================================================================
    // SYNC EVERYTHING
    // ================================================================
    @PostMapping("/all")
    public ResponseEntity<?> syncEverything() {
        log.info("🔄 Starting full sync...");
        
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("proposals", syncAllProposals().getBody());
        result.put("escrows", syncAllEscrows().getBody());
        result.put("accessPermissions", syncAccessPermissions().getBody());
        
        return ResponseEntity.ok(result);
    }

    // ================================================================
    // CHECK HELPERS
    // ================================================================
    private boolean checkProposalExists(String proposalId) {
        try {
            String result = fabricService.readProposal(proposalId);
            return result != null && !result.isEmpty() 
                && !result.equals("null") 
                && !result.contains("\"id\":\"\"");
        } catch (Exception e) {
            return false;
        }
    }

    private boolean checkEscrowExists(String escrowId) {
        try {
            String result = fabricService.getEscrow(escrowId);
            return result != null && !result.isEmpty() 
                && !result.equals("null");
        } catch (Exception e) {
            return false;
        }
    }

    private boolean checkPermissionExists(String proposalId, String userId) {
        try {
            String result = fabricService.checkPermission(proposalId, userId);
            return "true".equalsIgnoreCase(result != null ? result.trim() : "false");
        } catch (Exception e) {
            return false;
        }
    }

    // ================================================================
    // HELPERS
    // ================================================================
    private Map<String, Object> buildResult(int synced, int skipped, int failed, List<String> errors) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("synced", synced);
        result.put("skipped", skipped);
        result.put("failed", failed);
        if (!errors.isEmpty()) result.put("errors", errors);
        return result;
    }

    private String safe(String s) {
        return s != null ? s : "";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}