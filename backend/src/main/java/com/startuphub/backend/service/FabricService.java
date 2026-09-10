package com.startuphub.backend.service;

import io.grpc.ChannelCredentials;
import io.grpc.Grpc;
import io.grpc.ManagedChannel;
import io.grpc.TlsChannelCredentials;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.client.*;
import org.hyperledger.fabric.client.identity.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
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

    @Value("${blockchain.peer.tls.cert.path}")
    private String peerTlsCertPath;

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
            log.info("   TLS Cert Path: {}", peerTlsCertPath);
            log.info("   Wallet Path: {}", walletPath);

            // Validate certificate file exists
            Path tlsCertFile = Paths.get(peerTlsCertPath);
            if (!Files.exists(tlsCertFile)) {
                throw new RuntimeException("TLS certificate not found at: " + peerTlsCertPath);
            }
            log.info("   ✅ TLS certificate found");

            // Create gRPC channel with TLS
            ChannelCredentials tlsCredentials = TlsChannelCredentials.newBuilder()
                    .trustManager(tlsCertFile.toFile())
                    .build();

            grpcChannel = Grpc.newChannelBuilder(peerEndpoint, tlsCredentials)
                    .overrideAuthority(peerHost)
                    .build();

            // Load wallet identity
            Path walletDir = Paths.get(walletPath);

            // Read certificate
            Path certPath = walletDir.resolve("signcerts/cert.pem");
            Reader certReader = Files.newBufferedReader(certPath);
            X509Certificate certificate = Identities.readX509Certificate(certReader);

            // Read private key
            Path keyPath = walletDir.resolve("keystore/priv_sk");
            Reader keyReader = Files.newBufferedReader(keyPath);
            PrivateKey privateKey = Identities.readPrivateKey(keyReader);

            // ✅ CORRECTED: Use org.hyperledger.fabric.client.identity.Identity
            org.hyperledger.fabric.client.identity.Identity identity = 
                    new X509Identity(mspId, certificate);
            Signer signer = Signers.newPrivateKeySigner(privateKey);

            // Create Gateway
            gateway = Gateway.newInstance()
                    .identity(identity)
                    .signer(signer)
                    .connection(grpcChannel)
                    .evaluateOptions(options -> options.withDeadlineAfter(5, TimeUnit.SECONDS))
                    .endorseOptions(options -> options.withDeadlineAfter(15, TimeUnit.SECONDS))
                    .submitOptions(options -> options.withDeadlineAfter(5, TimeUnit.SECONDS))
                    .commitStatusOptions(options -> options.withDeadlineAfter(1, TimeUnit.MINUTES))
                    .connect();

            network = gateway.getNetwork(channelName);
            contract = network.getContract(chaincodeName);

            isConnected = true;
            log.info("✅ Connected to Hyperledger Fabric successfully!");
            log.info("   Channel: {}", channelName);
            log.info("   Chaincode: {}", chaincodeName);

        } catch (Exception e) {
            log.error("❌ Failed to connect to Fabric: {}", e.getMessage());
            log.warn("📦 Falling back to MOCK mode");
            isConnected = false;
        }
    }

    @PreDestroy
    public void disconnect() {
        try {
            if (gateway != null) {
                gateway.close();
            }
            if (grpcChannel != null) {
                grpcChannel.shutdownNow().awaitTermination(5, TimeUnit.SECONDS);
            }
            log.info("✅ Disconnected from Fabric");
        } catch (Exception e) {
            log.error("Error disconnecting: {}", e.getMessage());
        }
    }

    public boolean isConnected() {
        return isConnected && blockchainEnabled;
    }

    // ==========================================
    // SUBMIT TRANSACTION
    // ==========================================
    public String submitTransaction(String function, String... args) throws Exception {
        if (!isConnected()) {
            log.warn("📦 MOCK: submitTransaction({})", function);
            return "mock_tx_" + System.currentTimeMillis();
        }

        log.info("⛓️ Submitting transaction: {}", function);
        byte[] result = contract.submitTransaction(function, args);
        String txId = new String(result, StandardCharsets.UTF_8);
        log.info("✅ Transaction successful: {}", txId);
        return txId;
    }

    // ==========================================
    // EVALUATE TRANSACTION
    // ==========================================
    public String evaluateTransaction(String function, String... args) throws Exception {
        if (!isConnected()) {
            log.warn("📦 MOCK: evaluateTransaction({})", function);
            return getMockResponse(function);
        }

        log.info("⛓️ Evaluating transaction: {}", function);
        byte[] result = contract.evaluateTransaction(function, args);
        return new String(result, StandardCharsets.UTF_8);
    }

    // ==========================================
    // PROPOSAL FUNCTIONS
    // ==========================================
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

    public String getAllProposals() throws Exception {
        return evaluateTransaction("GetAllProposals");
    }

    public String getProposalsByFounder(String founderId) throws Exception {
        return evaluateTransaction("GetProposalsByFounder", founderId);
    }

    public String updateProposalWithDCH(
            String id, String ipfsCid, String sha256Hash, String tMeta,
            String summary, String keywords, String newRandomParam
    ) throws Exception {
        return submitTransaction("UpdateProposalWithDCH",
                id, ipfsCid, sha256Hash, tMeta, summary, keywords, newRandomParam);
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