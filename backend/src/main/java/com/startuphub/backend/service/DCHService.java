package com.startuphub.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.SecureRandom;

@Service
@Slf4j
public class DCHService {

    private static final BigInteger P = new BigInteger("FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF", 16);
    private static final BigInteger G = new BigInteger("2");
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    public static class DCHParams {
        private String privateKey;
        private String publicKey;
        private String randomParam;
        private String modulus;
        private String generator;

        public DCHParams(String privateKey, String publicKey, String randomParam, String modulus, String generator) {
            this.privateKey = privateKey;
            this.publicKey = publicKey;
            this.randomParam = randomParam;
            this.modulus = modulus;
            this.generator = generator;
        }

        public String getPrivateKey() { return privateKey; }
        public String getPublicKey() { return publicKey; }
        public String getRandomParam() { return randomParam; }
        public String getModulus() { return modulus; }
        public String getGenerator() { return generator; }
    }

    public DCHParams generateDCHParams() {
        BigInteger privateKey = new BigInteger(256, SECURE_RANDOM);
        BigInteger publicKey = G.modPow(privateKey, P);
        BigInteger randomParam = new BigInteger(256, SECURE_RANDOM);

        return new DCHParams(
            privateKey.toString(16),
            publicKey.toString(16),
            randomParam.toString(16),
            P.toString(16),
            G.toString(16)
        );
    }

    public String findCollision(String proposalId, String oldContent, String newContent, String oldRandomParam) {
        try {
            BigInteger oldR = new BigInteger(oldRandomParam, 16);
            BigInteger oldHash = new BigInteger(1, sha256(proposalId + oldContent));
            BigInteger newHash = new BigInteger(1, sha256(proposalId + newContent));

            BigInteger newR = oldR.add(newHash).subtract(oldHash).mod(P);

            return newR.toString(16);
        } catch (Exception e) {
            log.error("❌ Failed to find collision: {}", e.getMessage());
            return null;
        }
    }

    public String generateRandomParam() {
        return new BigInteger(256, SECURE_RANDOM).toString(16);
    }

    private byte[] sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return digest.digest(input.getBytes("UTF-8"));
    }
}