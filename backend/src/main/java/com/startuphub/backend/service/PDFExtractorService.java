package com.startuphub.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@Slf4j
public class PDFExtractorService {

    public String extractText(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        if (fileName == null) {
            throw new IOException("File name is null");
        }
        
        byte[] fileBytes = file.getBytes();
        log.info("📄 Processing file: {} ({} bytes)", fileName, fileBytes.length);
        
        // Check if it's a text file
        if (fileName.endsWith(".txt")) {
            log.info("📄 Processing as text file");
            return new String(fileBytes);
        }
        
        // Check if it's a PDF by header
        String header = new String(fileBytes, 0, Math.min(fileBytes.length, 5));
        if (!header.startsWith("%PDF")) {
            log.warn("⚠️ File does not start with %PDF header. Trying to extract as text...");
            return new String(fileBytes);
        }
        
        // Try PDF extraction
        try {
            return extractTextFromPDF(fileBytes);
        } catch (Exception e) {
            log.error("❌ PDF extraction failed: {}", e.getMessage());
            // Fallback: read as text
            log.info("📄 Falling back to text extraction");
            return new String(fileBytes);
        }
    }

    private String extractTextFromPDF(byte[] fileBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(fileBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(document.getNumberOfPages());
            String text = stripper.getText(document);
            
            if (text == null || text.trim().isEmpty()) {
                log.warn("⚠️ No text extracted from PDF");
                return "";
            }
            
            log.info("✅ Extracted {} characters from PDF ({} pages)", text.length(), document.getNumberOfPages());
            return text;
        } catch (Exception e) {
            log.error("❌ PDF extraction error: {}", e.getMessage());
            throw new IOException("Failed to extract text from PDF: " + e.getMessage());
        }
    }
}