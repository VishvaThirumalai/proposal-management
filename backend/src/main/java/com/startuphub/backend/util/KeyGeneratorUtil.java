package com.startuphub.backend.util;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;

public class KeyGeneratorUtil {

    private static final String ALGORITHM = "RSA";
    private static final int KEY_SIZE = 2048;

    /**
     * Generate RSA Key Pair (2048-bit)
     */
    public static KeyPair generateKeyPair() throws NoSuchAlgorithmException {
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(ALGORITHM);
        keyPairGenerator.initialize(KEY_SIZE);
        return keyPairGenerator.generateKeyPair();
    }

    /**
     * Encode Public Key to Base64 String
     */
    public static String encodePublicKey(PublicKey publicKey) {
        return Base64.getEncoder().encodeToString(publicKey.getEncoded());
    }

    /**
     * Encode Private Key to Base64 String
     */
    public static String encodePrivateKey(PrivateKey privateKey) {
        return Base64.getEncoder().encodeToString(privateKey.getEncoded());
    }

    /**
     * Decode Base64 String to Public Key
     */
    public static PublicKey decodePublicKey(String publicKeyStr) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(publicKeyStr);
        java.security.spec.X509EncodedKeySpec spec = 
            new java.security.spec.X509EncodedKeySpec(keyBytes);
        java.security.KeyFactory keyFactory = java.security.KeyFactory.getInstance(ALGORITHM);
        return keyFactory.generatePublic(spec);
    }

    /**
     * Decode Base64 String to Private Key
     */
    public static PrivateKey decodePrivateKey(String privateKeyStr) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(privateKeyStr);
        java.security.spec.PKCS8EncodedKeySpec spec = 
            new java.security.spec.PKCS8EncodedKeySpec(keyBytes);
        java.security.KeyFactory keyFactory = java.security.KeyFactory.getInstance(ALGORITHM);
        return keyFactory.generatePrivate(spec);
    }
}