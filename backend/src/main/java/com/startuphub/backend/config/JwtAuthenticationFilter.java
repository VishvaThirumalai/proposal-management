package com.startuphub.backend.config;

import com.startuphub.backend.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    /**
     * Skip JWT validation ONLY for public endpoints
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        
        // ✅ Only skip for public endpoints that don't need authentication
        boolean shouldSkip = path.startsWith("/auth/") ||
                             path.startsWith("/actuator/") ||
                             path.startsWith("/test/ipfs/");
        
        if (shouldSkip) {
            log.debug("⏭️ Skipping JWT filter for public endpoint: {}", path);
        }
        
        return shouldSkip;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // ✅ Log the request
        log.debug("🔍 Processing request: {} {}", request.getMethod(), request.getServletPath());

        // ✅ Extract Authorization header
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // ✅ Check if Authorization header exists
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("⚠️ No Bearer token found in Authorization header");
            filterChain.doFilter(request, response);
            return;
        }

        // ✅ Extract JWT token
        jwt = authHeader.substring(7);
        log.debug("🔑 JWT token extracted: {}", jwt.substring(0, Math.min(jwt.length(), 20)) + "...");

        try {
            // ✅ Extract user email from token
            userEmail = jwtUtil.extractUsername(jwt);
            log.debug("📧 Extracted email from token: {}", userEmail);

            // ✅ If email exists and user is not already authenticated
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                
                // ✅ Load user details
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                log.debug("👤 Loaded user details for: {}", userEmail);
                log.debug("👤 User authorities: {}", userDetails.getAuthorities());

                // ✅ Validate token
                if (jwtUtil.validateToken(jwt, userDetails)) {
                    log.debug("✅ JWT token validated successfully for: {}", userEmail);

                    // ✅ Create authentication token
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // ✅ Set authentication in SecurityContext
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("✅ Authentication set in SecurityContext for: {}", userEmail);
                } else {
                    log.warn("❌ JWT token validation failed for: {}", userEmail);
                }
            }

        } catch (Exception e) {
            log.error("❌ JWT processing error: {}", e.getMessage());
            // Continue without authentication - will result in 403 if authorization is required
        }

        // ✅ Continue filter chain
        filterChain.doFilter(request, response);
    }
}