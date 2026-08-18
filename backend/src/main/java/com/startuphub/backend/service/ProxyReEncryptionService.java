package com.startuphub.backend.service;

import com.startuphub.backend.util.AESUtils;
import com.startuphub.backend.util.RSAUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.PublicKey;
import java.util.Base64;

@Service
@Slf4j
public class ProxyReEncryptionService {

    /**
     * Proxy Re-Encryption: Transform ciphertext from one user to another
     * 
     * This is the core PRE operation:
     * 1. Takes AES key encrypted with Founder's public key (E)
     * 2. Decrypts it using Founder's private key (temporary)
     * 3. Re-encrypts it with Mentor's public key (RK)
     * 4. The proxy NEVER stores the plaintext AES key
     * 5. The proxy NEVER stores any private keys
     */
    public String proxyReEncrypt(
            String encryptedAESKeyBase64,
            String founderPrivateKey,
            String mentorPublicKey
    ) throws Exception {
        
        log.info("🔄 Proxy Re-Encryption started...");
        
        try {
            // Step 1: Decode encrypted AES key
            byte[] encryptedAESKey = Base64.getDecoder().decode(encryptedAESKeyBase64);
            log.info("📥 Decoded encrypted AES key");

            // Step 2: Decrypt using Founder's private key
            byte[] decryptedAESKeyBytes = RSAUtils.decrypt(encryptedAESKey, founderPrivateKey);
            log.info("🔓 Decrypted AES key using founder's private key");
            
            // ⚠️ Proxy never stores the plaintext key!
            // It only exists in memory for this operation

            // Step 3: Re-encrypt with Mentor's public key
            byte[] reEncryptedAESKey = RSAUtils.encrypt(decryptedAESKeyBytes, mentorPublicKey);
            log.info("🔐 Re-encrypted AES key with mentor's public key");
            
            // Step 4: Convert to Base64
            String rk = Base64.getEncoder().encodeToString(reEncryptedAESKey);
            log.info("✅ Re-Encryption Key (RK) generated successfully");
            
            return rk;
            
        } catch (Exception e) {
            log.error("❌ Proxy Re-Encryption failed: {}", e.getMessage());
            throw new RuntimeException("Proxy Re-Encryption failed: " + e.getMessage());
        }
    }

    /**
     * Decrypt AES key using user's private key
     * This is used when mentor/investor views the proposal
     */
    public SecretKey decryptAESKey(String reEncryptedKeyBase64, String userPrivateKey) throws Exception {
        log.info("🔓 Decrypting AES key with user's private key");
        
        byte[] reEncryptedKey = Base64.getDecoder().decode(reEncryptedKeyBase64);
        byte[] aesKeyBytes = RSAUtils.decrypt(reEncryptedKey, userPrivateKey);
        
        SecretKey aesKey = new javax.crypto.spec.SecretKeySpec(aesKeyBytes, "AES");
        log.info("✅ AES key recovered successfully");
        
        return aesKey;
    }

    /**
     * Decrypt proposal with AES key
     */
    public byte[] decryptProposal(byte[] encryptedProposal, SecretKey aesKey) throws Exception {
        log.info("🔓 Decrypting proposal with AES key");
        return AESUtils.decrypt(encryptedProposal, aesKey);
    }
}