package com.startuphub.backend.controller;

import com.startuphub.backend.model.Request;
import com.startuphub.backend.model.User;
import com.startuphub.backend.model.dto.ApproveRequestDTO;
import com.startuphub.backend.model.enums.RequestStatus;
import com.startuphub.backend.repository.RequestRepository;
import com.startuphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/requests")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('FOUNDER', 'MENTOR', 'INVESTOR')")
@Slf4j
public class RequestController {

    private final RequestRepository requestRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getRequests() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Request> requests = requestRepository.findByRecipient(currentUser);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to get requests: " + e.getMessage());
        }
    }

    @PutMapping("/{requestId}")
    public ResponseEntity<?> respondToRequest(
            @PathVariable Long requestId,
            @RequestBody ApproveRequestDTO requestDTO) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Request request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Request not found"));

            if (!request.getRecipient().getUserId().equals(currentUser.getUserId())) {
                return ResponseEntity.status(403).body("This request is not for you");
            }

            if (request.getStatus() != RequestStatus.PENDING) {
                return ResponseEntity.badRequest().body("Request is already processed");
            }

            if (requestDTO.isAccept()) {
                request.setStatus(RequestStatus.ACCEPTED);
            } else {
                request.setStatus(RequestStatus.REJECTED);
            }
            
            requestRepository.save(request);
            
            return ResponseEntity.ok("Request updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to respond: " + e.getMessage());
        }
    }
}