package com.startuphub.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.startuphub.backend.model.Escrow;
import com.startuphub.backend.model.EscrowMilestone;
import com.startuphub.backend.model.User;
import com.startuphub.backend.model.dto.EscrowRequestDTO;
import com.startuphub.backend.model.dto.EscrowResponseDTO;
import com.startuphub.backend.model.dto.MilestoneDTO;
import com.startuphub.backend.repository.EscrowMilestoneRepository;
import com.startuphub.backend.repository.EscrowRepository;
import com.startuphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EscrowService {

    private final EscrowRepository escrowRepository;
    private final EscrowMilestoneRepository milestoneRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ================================================================
    // GET ESCROWS BY INVESTOR EMAIL (for frontend)
    // ================================================================
    public List<EscrowResponseDTO> getEscrowsByInvestorEmail(String email) {
        log.info("📋 Getting escrows for investor: {}", email);
        
        User investor = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Investor not found: " + email));
        
        List<Escrow> escrows = escrowRepository.findByInvestorId(investor.getUserId());
        
        return escrows.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ================================================================
    // GET ESCROWS BY FOUNDER EMAIL (for frontend)
    // ================================================================
    public List<EscrowResponseDTO> getEscrowsByFounderEmail(String email) {
        log.info("📋 Getting escrows for founder: {}", email);
        
        User founder = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Founder not found: " + email));
        
        List<Escrow> escrows = escrowRepository.findByFounderId(founder.getUserId());
        
        return escrows.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ================================================================
    // ✅ NEW: SYNC FROM BLOCKCHAIN TO MYSQL
    // ================================================================
    @Transactional
    public void syncFromBlockchain(String escrowId, String blockchainJson) throws Exception {
        log.info("🔄 Syncing escrow {} from blockchain to MySQL", escrowId);

        if (blockchainJson == null || blockchainJson.isEmpty()) {
            log.warn("Empty blockchain JSON, skipping sync");
            return;
        }

        try {
            // Parse blockchain JSON
            JsonNode node = objectMapper.readTree(blockchainJson);

            // Find escrow in MySQL
            Escrow escrow = escrowRepository.findById(escrowId).orElse(null);
            if (escrow == null) {
                log.warn("Escrow {} not found in MySQL, skipping sync", escrowId);
                return;
            }

            // Update escrow fields
            if (node.has("releasedAmount")) {
                escrow.setReleasedAmount(node.get("releasedAmount").asDouble());
            }
            if (node.has("status")) {
                escrow.setStatus(node.get("status").asText());
            }
            escrow.setUpdatedAt(LocalDateTime.now());
            escrowRepository.save(escrow);

            // Update milestones
            if (node.has("milestones")) {
                JsonNode milestones = node.get("milestones");

                for (JsonNode m : milestones) {
                    String milestoneId = m.get("milestoneId").asText();

                    EscrowMilestone em = milestoneRepository
                            .findByEscrowIdAndMilestoneId(escrowId, milestoneId)
                            .orElse(null);

                    if (em == null) {
                        log.warn("Milestone {} not found in MySQL", milestoneId);
                        continue;
                    }

                    // Update fields
                    if (m.has("status")) {
                        em.setStatus(m.get("status").asText());
                    }
                    if (m.has("proofCid")) {
                        em.setProofCid(m.get("proofCid").asText());
                    }
                    if (m.has("proofHash")) {
                        em.setProofHash(m.get("proofHash").asText());
                    }
                    if (m.has("proofNotes")) {
                        em.setProofNotes(m.get("proofNotes").asText());
                    }
                    if (m.has("submittedBy")) {
                        em.setSubmittedBy(m.get("submittedBy").asText());
                    }
                    if (m.has("approvals")) {
                        em.setApprovals(m.get("approvals").toString());
                    }
                    if (m.has("rejections")) {
                        em.setRejections(m.get("rejections").toString());
                    }
                    if (m.has("rejectReason")) {
                        em.setRejectReason(m.get("rejectReason").asText());
                    }
                    if (m.has("submittedAt") && !m.get("submittedAt").asText().isEmpty()) {
                        em.setSubmittedAt(LocalDateTime.parse(m.get("submittedAt").asText()));
                    }
                    if (m.has("approvedAt") && !m.get("approvedAt").asText().isEmpty()) {
                        em.setApprovedAt(LocalDateTime.parse(m.get("approvedAt").asText()));
                    }
                    if (m.has("releasedAt") && !m.get("releasedAt").asText().isEmpty()) {
                        em.setReleasedAt(LocalDateTime.parse(m.get("releasedAt").asText()));
                    }

                    milestoneRepository.save(em);
                }
            }

            log.info("✅ Escrow {} synced successfully from blockchain", escrowId);

        } catch (Exception e) {
            log.error("❌ Sync failed for escrow {}: {}", escrowId, e.getMessage());
            throw e;
        }
    }

    // ================================================================
    // Convert Escrow entity to DTO with milestones
    // ================================================================
    private EscrowResponseDTO toDTO(Escrow escrow) {
        List<EscrowMilestone> milestones = milestoneRepository.findByEscrowId(escrow.getEscrowId());
        
        List<EscrowResponseDTO.MilestoneInfo> milestoneInfos = new ArrayList<>();
        
        for (EscrowMilestone m : milestones) {
            EscrowResponseDTO.MilestoneInfo info = EscrowResponseDTO.MilestoneInfo.builder()
                    .milestoneId(m.getMilestoneId())
                    .description(m.getDescription())
                    .amount(m.getAmount())
                    .dueDate(m.getDueDate())
                    .status(m.getStatus())
                    .proofCid(m.getProofCid())
                    .proofHash(m.getProofHash())
                    .submittedAt(m.getSubmittedAt())
                    .approvedAt(m.getApprovedAt())
                    .releasedAt(m.getReleasedAt())
                    .rejectReason(m.getRejectReason())
                    .approvals(parseJsonList(m.getApprovals()))
                    .rejections(parseJsonList(m.getRejections()))
                    .build();
            milestoneInfos.add(info);
        }
        
        return EscrowResponseDTO.builder()
                .escrowId(escrow.getEscrowId())
                .startupId(String.valueOf(escrow.getStartupId()))
                .investorId(String.valueOf(escrow.getInvestorId()))
                .founderId(String.valueOf(escrow.getFounderId()))
                .totalAmount(escrow.getTotalAmount())
                .releasedAmount(escrow.getReleasedAmount())
                .status(escrow.getStatus())
                .requiredApprovals(escrow.getRequiredApprovals())
                .approvers(parseJsonList(escrow.getApprovers()))
                .blockchainTxHash(escrow.getBlockchainTxHash())
                .createdAt(escrow.getCreatedAt())
                .milestones(milestoneInfos)
                .build();
    }

    // ================================================================
    // HELPER: Parse JSON list safely
    // ================================================================
    @SuppressWarnings("unchecked")
    private List<String> parseJsonList(String json) {
        if (json == null || json.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, List.class);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    // ================================================================
    // CREATE ESCROW
    // ================================================================
    @Transactional
    public Escrow createEscrow(EscrowRequestDTO dto, String escrowId, String txHash) throws Exception {
        log.info("📝 Creating escrow: {}", escrowId);

        Escrow escrow = Escrow.builder()
                .escrowId(escrowId)
                .startupId(parseId(dto.getStartupId()))
                .investorId(parseId(dto.getInvestorId()))
                .founderId(parseId(dto.getFounderId()))
                .totalAmount(dto.getTotalAmount())
                .releasedAmount(0.0)
                .requiredApprovals(dto.getApprovers() != null ? dto.getApprovers().size() : 1)
                .approvers(objectMapper.writeValueAsString(dto.getApprovers()))
                .status("FUNDS_LOCKED")
                .blockchainTxHash(txHash)
                .build();

        escrowRepository.save(escrow);

        if (dto.getMilestones() != null) {
            for (MilestoneDTO m : dto.getMilestones()) {
                EscrowMilestone milestone = EscrowMilestone.builder()
                        .milestoneId(m.getMilestoneId())
                        .escrowId(escrowId)
                        .description(m.getDescription())
                        .amount(m.getAmount())
                        .dueDate(m.getDueDate())
                        .status("PENDING")
                        .build();
                milestoneRepository.save(milestone);
            }
        }

        log.info("✅ Escrow saved: {}", escrowId);
        return escrow;
    }

    // ================================================================
    // GET ESCROW
    // ================================================================
    public Escrow getEscrow(String escrowId) {
        return escrowRepository.findById(escrowId).orElse(null);
    }

    public List<Escrow> getEscrowsByStartup(Long startupId) {
        return escrowRepository.findByStartupId(startupId);
    }

    public List<Escrow> getEscrowsByInvestor(Long investorId) {
        return escrowRepository.findByInvestorId(investorId);
    }

    public List<Escrow> getEscrowsByFounder(Long founderId) {
        return escrowRepository.findByFounderId(founderId);
    }

    public List<EscrowMilestone> getMilestones(String escrowId) {
        return milestoneRepository.findByEscrowId(escrowId);
    }

    // ================================================================
    // GET ESCROW AS DTO
    // ================================================================
    public EscrowResponseDTO getEscrowDTO(String escrowId) {
        log.info("📋 Getting escrow DTO: {}", escrowId);
        
        Escrow escrow = escrowRepository.findById(escrowId).orElse(null);
        if (escrow == null) {
            log.warn("⚠️ Escrow not found in MySQL: {}", escrowId);
            return null;
        }
        
        return toDTO(escrow);
    }

    // ================================================================
    // UPDATE MILESTONE PROOF
    // ================================================================
    @Transactional
    public void updateMilestoneProof(String escrowId, String milestoneId,
                                     String proofCid, String txHash) {
        EscrowMilestone milestone = milestoneRepository.findByEscrowIdAndMilestoneId(escrowId, milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found: " + milestoneId));

        milestone.setProofCid(proofCid);
        milestone.setStatus("PROOF_SUBMITTED");
        milestone.setSubmittedAt(LocalDateTime.now());
        milestone.setBlockchainTxHash(txHash);
        milestoneRepository.save(milestone);
    }

    // ================================================================
    // UPDATE MILESTONE APPROVAL
    // ================================================================
    @Transactional
    public void updateMilestoneApproval(String escrowId, String milestoneId,
                                        String approverId, String txHash) throws Exception {
        EscrowMilestone milestone = milestoneRepository.findByEscrowIdAndMilestoneId(escrowId, milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found: " + milestoneId));

        List<String> approvals = parseJsonList(milestone.getApprovals());
        if (!approvals.contains(approverId)) {
            approvals.add(approverId);
        }
        milestone.setApprovals(objectMapper.writeValueAsString(approvals));

        Escrow escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new RuntimeException("Escrow not found: " + escrowId));

        if (approvals.size() >= escrow.getRequiredApprovals()) {
            milestone.setStatus("APPROVED");
            milestone.setApprovedAt(LocalDateTime.now());
        }

        milestone.setBlockchainTxHash(txHash);
        milestoneRepository.save(milestone);
        updateEscrowReleasedAmount(escrowId);
    }

    // ================================================================
    // UPDATE MILESTONE REJECTION
    // ================================================================
    @Transactional
    public void updateMilestoneRejection(String escrowId, String milestoneId,
                                         String rejectorId, String reason, String txHash) throws Exception {
        EscrowMilestone milestone = milestoneRepository.findByEscrowIdAndMilestoneId(escrowId, milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found: " + milestoneId));

        List<String> rejections = parseJsonList(milestone.getRejections());
        rejections.add(rejectorId);
        milestone.setRejections(objectMapper.writeValueAsString(rejections));
        milestone.setStatus("REJECTED");
        milestone.setRejectReason(reason);
        milestone.setBlockchainTxHash(txHash);
        milestoneRepository.save(milestone);
    }

    // ================================================================
    // UPDATE ESCROW RELEASED AMOUNT
    // ================================================================
    private void updateEscrowReleasedAmount(String escrowId) {
        List<EscrowMilestone> milestones = milestoneRepository.findByEscrowId(escrowId);

        double totalReleased = milestones.stream()
                .filter(m -> "FUNDS_RELEASED".equals(m.getStatus()))
                .mapToDouble(EscrowMilestone::getAmount)
                .sum();

        Escrow escrow = escrowRepository.findById(escrowId).orElse(null);
        if (escrow != null) {
            escrow.setReleasedAmount(totalReleased);

            boolean allDone = !milestones.isEmpty() && milestones.stream()
                    .allMatch(m -> "FUNDS_RELEASED".equals(m.getStatus()));

            if (allDone) {
                escrow.setStatus("COMPLETED");
            } else if (totalReleased > 0) {
                escrow.setStatus("PARTIAL_RELEASED");
            }

            escrow.setUpdatedAt(LocalDateTime.now());
            escrowRepository.save(escrow);
        }
    }

    // ================================================================
    // PARSE ID HELPER
    // ================================================================
    private Long parseId(String raw) {
        if (raw == null) return null;
        String cleaned = raw
                .replace("PROP_", "")
                .replace("INV_", "")
                .replace("FOUNDER_", "")
                .replace("MENTOR_", "");
        try {
            return Long.parseLong(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}