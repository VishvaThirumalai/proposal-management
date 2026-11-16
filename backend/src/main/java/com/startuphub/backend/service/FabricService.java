package com.startuphub.backend.service;

import io.grpc.ChannelCredentials;
import io.grpc.Grpc;
import io.grpc.ManagedChannel;
import io.grpc.Metadata;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import io.grpc.TlsChannelCredentials;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.client.*;
import org.hyperledger.fabric.client.identity.*;
import org.hyperledger.fabric.protos.gateway.ErrorDetail;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.google.protobuf.Any;
import com.google.protobuf.InvalidProtocolBufferException;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.InputStream;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class FabricService {

    @Value("${blockchain.enabled:false}")
    private boolean blockchainEnabled;

    @Value("${blockchain.channel.name}")
    private String channelName;

    @Value("${blockchain.chaincode.name}")
    private String chaincodeName;

    @Value("${blockchain.wallet.path:wallet}")
    private String walletPath;

    @Value("${blockchain.peer.endpoint:localhost:7051}")
    private String peerEndpoint;

    @Value("${blockchain.peer.host:peer0.org1.example.com}")
    private String peerHost;

    @Value("${blockchain.msp.id:Org1MSP}")
    private String mspId;

    private ManagedChannel grpcChannel;
    private Gateway gateway;
    private Network network;
    private Contract contract;
    private boolean isConnected = false;

    @PostConstruct
    public void init() {
        if (!blockchainEnabled) {
            log.info("📦 Blockchain mode: MOCK");
            return;
        }

        try {
            log.info("🔗 Connecting to Hyperledger Fabric...");
            log.info("   Peer Endpoint: {}", peerEndpoint);
            log.info("   Wallet Path: {}", walletPath);

            ClassPathResource tlsCertResource = new ClassPathResource("fabric/peer-tls-ca.crt");
            InputStream tlsCertStream = tlsCertResource.getInputStream();
            log.info("   ✅ TLS certificate loaded from classpath");

            ChannelCredentials tlsCredentials = TlsChannelCredentials.newBuilder()
                    .trustManager(tlsCertStream)
                    .build();

            grpcChannel = Grpc.newChannelBuilder(peerEndpoint, tlsCredentials)
                    .overrideAuthority(peerHost)
                    .keepAliveTime(60, TimeUnit.SECONDS)
                    .keepAliveTimeout(20, TimeUnit.SECONDS)
                    .keepAliveWithoutCalls(true)
                    .maxInboundMessageSize(50 * 1024 * 1024)
                    .build();

            Path walletDir = Paths.get(walletPath);

            Path certPath = walletDir.resolve("signcerts/cert.pem");
            Reader certReader = Files.newBufferedReader(certPath);
            X509Certificate certificate = Identities.readX509Certificate(certReader);

            Path keyPath = walletDir.resolve("keystore/priv_sk");
            Reader keyReader = Files.newBufferedReader(keyPath);
            PrivateKey privateKey = Identities.readPrivateKey(keyReader);

            org.hyperledger.fabric.client.identity.Identity identity = new X509Identity(mspId, certificate);
            Signer signer = Signers.newPrivateKeySigner(privateKey);

            gateway = Gateway.newInstance()
                    .identity(identity)
                    .signer(signer)
                    .connection(grpcChannel)
                    .evaluateOptions(options -> options.withDeadlineAfter(30, TimeUnit.SECONDS))
                    .endorseOptions(options -> options.withDeadlineAfter(60, TimeUnit.SECONDS))
                    .submitOptions(options -> options.withDeadlineAfter(60, TimeUnit.SECONDS))
                    .commitStatusOptions(options -> options.withDeadlineAfter(3, TimeUnit.MINUTES))
                    .connect();

            network = gateway.getNetwork(channelName);
            contract = network.getContract(chaincodeName);

            isConnected = true;
            log.info("✅ Connected to Hyperledger Fabric successfully!");
            log.info("   Channel: {}", channelName);
            log.info("   Chaincode: {}", chaincodeName);

        } catch (Exception e) {
            log.error("❌ Failed to connect to Fabric: {}", e.getMessage(), e);
            log.warn("📦 Falling back to MOCK mode");
            isConnected = false;
        }
    }

    @PreDestroy
    public void disconnect() {
        try {
            if (gateway != null) {
                gateway.close();
                gateway = null;
            }
            if (grpcChannel != null) {
                grpcChannel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
                grpcChannel = null;
            }
            network = null;
            contract = null;
            isConnected = false;
            log.info("✅ Disconnected from Fabric");
        } catch (Exception e) {
            log.error("Error disconnecting: {}", e.getMessage());
        }
    }

    public boolean isConnected() {
        return isConnected && blockchainEnabled;
    }

    // ==========================================
    // ERROR DETAIL EXTRACTION (FIXED)
    // ==========================================
    private String extractErrorDetails(Exception e) {
        StringBuilder sb = new StringBuilder();

        Throwable cause = e;
        while (cause != null) {
            if (cause instanceof StatusRuntimeException) {
                StatusRuntimeException sre = (StatusRuntimeException) cause;
                Status status = sre.getStatus();

                sb.append("[").append(status.getCode()).append("] ");
                if (status.getDescription() != null) {
                    sb.append(status.getDescription());
                }

                // Extract peer details from TRAILERS
                Metadata trailers = sre.getTrailers();
                if (trailers != null) {
                    Metadata.Key<byte[]> key = Metadata.Key.of(
                            "grpc-status-details-bin", Metadata.BINARY_BYTE_MARSHALLER);
                    byte[] detailsBytes = trailers.get(key);
                    if (detailsBytes != null) {
                        try {
                            com.google.rpc.Status rpcStatus = 
                                com.google.rpc.Status.parseFrom(detailsBytes);
                            for (Any detail : rpcStatus.getDetailsList()) {
                                try {
                                    ErrorDetail ed = detail.unpack(ErrorDetail.class);
                                    sb.append("\n  ── Peer: ").append(ed.getAddress())
                                      .append("\n     MSP: ").append(ed.getMspId())
                                      .append("\n     Message: ").append(ed.getMessage());
                                } catch (InvalidProtocolBufferException ignored) {}
                            }
                        } catch (InvalidProtocolBufferException ignored) {}
                    }
                }
                return sb.toString();
            }
            if (cause.getCause() == cause) break;
            cause = cause.getCause();
        }

        return e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
    }

    // ==========================================
    // SUBMIT TRANSACTION (with Auto-Reconnect)
    // ==========================================
    public String submitTransaction(String function, String... args) throws Exception {
        if (!isConnected()) {
            log.warn("📦 MOCK: submitTransaction({})", function);
            return "mock_tx_" + System.currentTimeMillis();
        }

        try {
            log.info("⛓️ Submitting transaction: {}", function);
            byte[] result = contract.submitTransaction(function, args);
            String txId = new String(result, StandardCharsets.UTF_8);
            log.info("✅ Transaction successful: {}", function);
            return txId;
        } catch (Exception e) {
            String details = extractErrorDetails(e);
            log.warn("⚠️ Transaction failed: {}", details);

            try {
                disconnect();
                Thread.sleep(2000);
                init();

                if (isConnected()) {
                    log.info("🔄 Reconnected, retrying: {}", function);
                    byte[] result = contract.submitTransaction(function, args);
                    String txId = new String(result, StandardCharsets.UTF_8);
                    log.info("✅ Retry successful: {}", function);
                    return txId;
                }
            } catch (Exception retryEx) {
                log.error("❌ Retry failed: {}", extractErrorDetails(retryEx));
            }

            throw new Exception("Blockchain update failed: " + details, e);
        }
    }

    // ==========================================
    // EVALUATE TRANSACTION (with Auto-Reconnect)
    // ==========================================
    public String evaluateTransaction(String function, String... args) throws Exception {
        if (!isConnected()) {
            log.warn("📦 MOCK: evaluateTransaction({})", function);
            return getMockResponse(function);
        }

        try {
            log.info("⛓️ Evaluating transaction: {}", function);
            byte[] result = contract.evaluateTransaction(function, args);
            return new String(result, StandardCharsets.UTF_8);
        } catch (Exception e) {
            String details = extractErrorDetails(e);
            log.warn("⚠️ Query failed: {}", details);

            try {
                disconnect();
                Thread.sleep(2000);
                init();

                if (isConnected()) {
                    log.info("🔄 Reconnected, retrying: {}", function);
                    byte[] result = contract.evaluateTransaction(function, args);
                    return new String(result, StandardCharsets.UTF_8);
                }
            } catch (Exception retryEx) {
                log.error("❌ Retry failed: {}", extractErrorDetails(retryEx));
            }

            throw new Exception("Blockchain query failed: " + details, e);
        }
    }

    // ==========================================
    // PROPOSAL FUNCTIONS
    // ==========================================
    public String createProposal(String id, String founderId, String title, String domain, String stage,
            String fundingAmount, String ipfsCid, String sha256Hash, String tMeta,
            String summary, String keywords, String technologyStack,
            String mentorRequirements, String investorPitch,
            String problemStatement, String solution, String businessModel) throws Exception {
        return submitTransaction("CreateProposal", id, founderId, title, domain, stage, fundingAmount,
                ipfsCid, sha256Hash, tMeta, summary, keywords, technologyStack,
                mentorRequirements, investorPitch, problemStatement, solution, businessModel);
    }

    public String readProposal(String id) throws Exception {
        return evaluateTransaction("ReadProposal", id);
    }

    public String getAllProposals() throws Exception {
        return evaluateTransaction("GetAllProposals");
    }

    public String getProposalsByFounder(String founderId) throws Exception {
        return evaluateTransaction("GetProposalsByFounder", founderId);
    }

    public String updateProposalWithDCH(String id, String ipfsCid, String sha256Hash, String tMeta,
            String summary, String keywords, String newRandomParam) throws Exception {
        return submitTransaction("UpdateProposalWithDCH", id, ipfsCid, sha256Hash, tMeta, summary, keywords, newRandomParam);
    }

    public String grantAccess(String proposalId, String userId, String userRole, String grantedBy) throws Exception {
        return submitTransaction("GrantAccess", proposalId, userId, userRole, grantedBy);
    }

    public String revokeAccess(String proposalId, String userId) throws Exception {
        return submitTransaction("RevokeAccess", proposalId, userId);
    }

    public String checkPermission(String proposalId, String userId) throws Exception {
        return evaluateTransaction("CheckPermission", proposalId, userId);
    }

    public String initDCH(String blockHash, String randomParam, String publicKey, String modulus, String generator) throws Exception {
        return submitTransaction("InitDCH", blockHash, randomParam, publicKey, modulus, generator);
    }

    public String getDCHParams() throws Exception {
        return evaluateTransaction("GetDCHParams");
    }

    // ==========================================
    // ESCROW FUNCTIONS
    // ==========================================
    public String createEscrow(String escrowId, String startupId, String investorId, String founderId,
                                String totalAmount, String milestonesJson, String approversJson) throws Exception {
        log.info("⛓️ Creating escrow: {}", escrowId);
        return submitTransaction("CreateEscrow", escrowId, startupId, investorId, founderId,
                totalAmount, milestonesJson, approversJson);
    }

    public String submitMilestoneProof(String escrowId, String milestoneId, String proofCid,
                                        String proofHash, String submittedBy) throws Exception {
        log.info("⛓️ Submitting milestone proof: {}/{}", escrowId, milestoneId);
        return submitTransaction("SubmitMilestoneProof", escrowId, milestoneId, proofCid,
                proofHash, submittedBy);
    }

    public String approveMilestone(String escrowId, String milestoneId, String approverId) throws Exception {
        log.info("⛓️ Approving milestone: {}/{}", escrowId, milestoneId);
        return submitTransaction("ApproveMilestone", escrowId, milestoneId, approverId);
    }

    public String rejectMilestone(String escrowId, String milestoneId, String approverId, String reason) throws Exception {
        log.info("⛓️ Rejecting milestone: {}/{}", escrowId, milestoneId);
        return submitTransaction("RejectMilestone", escrowId, milestoneId, approverId, reason);
    }

    public String releaseMilestoneFunds(String escrowId, String milestoneId) throws Exception {
        log.info("⛓️ Releasing milestone funds: {}/{}", escrowId, milestoneId);
        return submitTransaction("ReleaseMilestoneFunds", escrowId, milestoneId);
    }

    public String getEscrow(String escrowId) throws Exception {
        log.info("⛓️ Getting escrow: {}", escrowId);
        return evaluateTransaction("GetEscrow", escrowId);
    }

    public String getEscrowsByStartup(String startupId) throws Exception {
        log.info("⛓️ Getting escrows for startup: {}", startupId);
        return evaluateTransaction("GetEscrowsByStartup", startupId);
    }

    public String getEscrowsByInvestor(String investorId) throws Exception {
        log.info("⛓️ Getting escrows for investor: {}", investorId);
        return evaluateTransaction("GetEscrowsByInvestor", investorId);
    }

    public String getEscrowsByFounder(String founderId) throws Exception {
        log.info("⛓️ Getting escrows for founder: {}", founderId);
        return evaluateTransaction("GetEscrowsByFounder", founderId);
    }

    // ==========================================
    // MOCK RESPONSES
    // ==========================================
    private String getMockResponse(String function) {
        if ("GetAllProposals".equals(function)) {
            return "[{\"id\":\"PROP_001\",\"founderId\":\"FOUNDER_001\",\"title\":\"AgroVision\",\"domain\":\"Agriculture\",\"stage\":\"Prototype\",\"fundingAmount\":4000000,\"ipfsCid\":\"QmXbujd92...\",\"sha256Hash\":\"0x7a9f8b3c...\",\"tMeta\":\"AGRICULTURE_CLUSTER\",\"version\":1,\"status\":\"ACTIVE\",\"summary\":\"AI-powered crop disease detection platform\",\"keywords\":\"Agriculture, AI, Computer Vision\",\"technologyStack\":\"CNN, Deep Learning, Mobile App\",\"mentorRequirements\":\"Computer Vision, AI, Agriculture\",\"investorPitch\":\"Seeking 40 Lakhs\",\"problemStatement\":\"Farmers struggle to identify crop diseases early\",\"solution\":\"AI-powered mobile app for real-time detection\",\"businessModel\":\"Subscription-based\",\"timestamp\":\"2026-09-07T11:21:32Z\"}]";
        } else if ("CheckPermission".equals(function)) {
            return "true";
        } else if ("GetDCHParams".equals(function)) {
            return "{\"blockHash\":\"0x7a9f8b3c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a\",\"randomParam\":\"0x1234567890abcdef\",\"publicKey\":\"0xabcdef1234567890\",\"modulus\":\"0xffffffffffffffff\",\"generator\":\"0x02\"}";
        }
        return "[]";
    }
}