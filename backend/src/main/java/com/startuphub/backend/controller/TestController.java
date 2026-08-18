package com.startuphub.backend.controller;

import com.startuphub.backend.service.IPFSService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class TestController {

    private final IPFSService ipfsService;

    @GetMapping("/ipfs/status")
    public ResponseEntity<?> checkIPFS() {
        Map<String, Object> response = new HashMap<>();
        response.put("connected", ipfsService.isIPFSConnected());
        response.put("version", ipfsService.getIPFSVersion());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ipfs/upload")
    public ResponseEntity<?> uploadToIPFS(@RequestParam("file") MultipartFile file) {
        try {
            String cid = ipfsService.uploadToIPFS(file);
            String sha256 = ipfsService.generateSHA256(file.getBytes());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cid", cid);
            response.put("sha256", sha256);
            response.put("fileName", file.getOriginalFilename());
            response.put("size", file.getSize());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/ipfs/download/{cid}")
    public ResponseEntity<?> downloadFromIPFS(@PathVariable String cid) {
        try {
            byte[] content = ipfsService.downloadFromIPFS(cid);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cid", cid);
            response.put("size", content.length);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Download failed: " + e.getMessage());
        }
    }
}