package com.startuphub.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.BadPaddingException;  // ✅ ADD THIS
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Map;

@Service
@Slf4j
public class IPFSService {

    @Value("${ipfs.api.url:http://127.0.0.1:5001}")
    private String ipfsApiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==========================================
    // IPFS UPLOAD / DOWNLOAD
    // ==========================================

    public String uploadToIPFS(byte[] fileContent) throws IOException {
        String url = ipfsApiUrl + "/api/v0/add";

        ByteArrayResource resource = new ByteArrayResource(fileContent) {
            @Override
            public String getFilename() {
                return "proposal.pdf";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        if (response.getBody() == null || response.getBody().get("Hash") == null) {
            throw new IOException("IPFS upload failed");
        }

        String cid = response.getBody().get("Hash").toString();
        log.info("✅ Uploaded to IPFS: {}", cid);
        return cid;
    }

    public String uploadToIPFS(MultipartFile file) throws IOException {
        return uploadToIPFS(file.getBytes());
    }

    public byte[] downloadFromIPFS(String cid) throws IOException {
        String url = ipfsApiUrl + "/api/v0/cat?arg=" + cid;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Origin", "http://127.0.0.1:5001");

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<byte[]> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                byte[].class
        );

        if (response.getBody() == null) {
            throw new IOException("Failed to download file from IPFS");
        }

        log.info("✅ Downloaded from IPFS: {}", cid);
        return response.getBody();
    }

    // ==========================================
    // AES ENCRYPTION / DECRYPTION
    // ==========================================

    public SecretKey generateAESKey() throws Exception {
        KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
        keyGenerator.init(256);
        return keyGenerator.generateKey();
    }

    public byte[] encryptAES(byte[] data, SecretKey key) throws Exception {
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        return cipher.doFinal(data);
    }

    public byte[] decryptAES(byte[] data, SecretKey key) throws Exception {
        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.DECRYPT_MODE, key);
        return cipher.doFinal(data);
    }

    // ==========================================
    // ✅ AES KEY ENCRYPTION / DECRYPTION
    // ==========================================

    /**
     * Encrypt AES key with RSA public key - returns clean Base64 (no colon)
     */
    public String encryptAESKeyWithPublicKey(String aesKeyBase64, String publicKeyStr) throws Exception {
        PublicKey publicKey = decodePublicKey(publicKeyStr);
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        byte[] encrypted = cipher.doFinal(aesKeyBase64.getBytes());
        return Base64.getEncoder().encodeToString(encrypted);
    }

    /**
     * Decrypt AES key with RSA private key - handles colon format
     */
    public String decryptAESKeyWithPrivateKey(String encryptedData, String privateKeyStr) throws Exception {
    try {
        PrivateKey privateKey = decodePrivateKey(privateKeyStr);
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.DECRYPT_MODE, privateKey);

        // Handle colon-separated format
        String dataToDecrypt = encryptedData;
        if (encryptedData.contains(":")) {
            String[] parts = encryptedData.split(":");
            dataToDecrypt = parts[0];
            log.debug("🔑 Extracted encrypted data (colon format)");
        }

        // Clean the Base64 string
        String cleanData = dataToDecrypt
                .replaceAll("\\s", "")
                .replaceAll("\n", "")
                .replaceAll("\r", "")
                .replaceAll("[^A-Za-z0-9+/=]", "");

        byte[] encryptedBytes = Base64.getDecoder().decode(cleanData);
        byte[] decrypted = cipher.doFinal(encryptedBytes);

        log.info("✅ Decryption successful! Size: {} bytes", decrypted.length);
        // ✅ Return as raw bytes string (not Base64)
        return new String(decrypted);
        // If you need Base64, use: return Base64.getEncoder().encodeToString(decrypted);

    } catch (IllegalArgumentException e) {
        log.error("❌ Base64 decoding failed: {}", e.getMessage());
        throw new Exception("Invalid encrypted data format - " + e.getMessage());
    } catch (BadPaddingException e) {
        log.error("❌ Padding error: Wrong private key used");
        throw new Exception("Wrong private key used for decryption");
    }
}
    // ==========================================
    // RSA KEY OPERATIONS
    // ==========================================

    public KeyPair generateRSAKeyPair() throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        return keyPairGenerator.generateKeyPair();
    }

    public String encodePublicKey(PublicKey publicKey) {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    public String encodePrivateKey(PrivateKey privateKey) {
        return Base64.getEncoder().encodeToString(privateKey.getEncoded());
    }

    public PublicKey decodePublicKey(String publicKeyStr) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(publicKeyStr);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(spec);
    }

    public PrivateKey decodePrivateKey(String privateKeyStr) throws Exception {
        String cleanKey = privateKeyStr
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replace("-----BEGIN RSA PRIVATE KEY-----", "")
                .replace("-----END RSA PRIVATE KEY-----", "")
                .replaceAll("\\s", "")
                .replaceAll("\n", "")
                .replaceAll("\r", "")
                .replaceAll("[^A-Za-z0-9+/=]", "");

        byte[] keyBytes = Base64.getDecoder().decode(cleanKey);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePrivate(spec);
    }

    // ==========================================
    // DEPRECATED - Kept for backward compatibility
    // ==========================================

    @Deprecated
    public String encryptAESString(String data) throws Exception {
        SecretKey key = generateAESKey();
        byte[] encrypted = encryptAES(data.getBytes(), key);
        String encryptedBase64 = Base64.getEncoder().encodeToString(encrypted);
        String keyBase64 = Base64.getEncoder().encodeToString(key.getEncoded());
        return encryptedBase64 + ":" + keyBase64;
    }

    @Deprecated
    public String decryptAESString(String encryptedData) throws Exception {
        String[] parts = encryptedData.split(":");
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid encrypted data format. Expected 'data:key'");
        }
        byte[] encryptedBytes = Base64.getDecoder().decode(parts[0]);
        byte[] keyBytes = Base64.getDecoder().decode(parts[1]);
        SecretKey key = new SecretKeySpec(keyBytes, "AES");
        byte[] decrypted = decryptAES(encryptedBytes, key);
        return new String(decrypted);
    }

    @Deprecated
    public String encryptWithPublicKey(String data, String publicKeyStr) throws Exception {
        PublicKey publicKey = decodePublicKey(publicKeyStr);
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        byte[] encrypted = cipher.doFinal(data.getBytes());
        return Base64.getEncoder().encodeToString(encrypted);
    }

    @Deprecated
    public String decryptWithPrivateKey(String encryptedData, String privateKeyStr) throws Exception {
        return decryptAESKeyWithPrivateKey(encryptedData, privateKeyStr);
    }

    // ==========================================
    // SHA-256 HASH
    // ==========================================

    public String generateSHA256(byte[] data) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(data);
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // ==========================================
    // IPFS CONNECTION TESTS
    // ==========================================

    public boolean isIPFSConnected() {
        try {
            String url = ipfsApiUrl + "/api/v0/version";
            restTemplate.postForEntity(url, null, String.class);
            log.info("✅ IPFS connected to: {}", ipfsApiUrl);
            return true;
        } catch (Exception e) {
            log.error("❌ IPFS not connected: {}", e.getMessage());
            return false;
        }
    }

    public String getIPFSVersion() {
        try {
            String url = ipfsApiUrl + "/api/v0/version";
            ResponseEntity<String> response = restTemplate.postForEntity(url, null, String.class);
            return response.getBody();
        } catch (Exception e) {
            log.error("❌ Failed to get IPFS version: {}", e.getMessage());
            return "Error: " + e.getMessage();
        }
    }
}