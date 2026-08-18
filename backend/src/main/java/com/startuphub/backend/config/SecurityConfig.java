package com.startuphub.backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ✅ CORS Configuration
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                
                // ✅ Disable CSRF (we're using JWT, not sessions)
                .csrf(AbstractHttpConfigurer::disable)
                
                // ✅ Stateless session management
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                
                // ✅ Authorization rules
                .authorizeHttpRequests(auth -> auth
                        // ==========================================
                        // PUBLIC ENDPOINTS - NO AUTHENTICATION REQUIRED
                        // ==========================================
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/test/ipfs/**").permitAll()
                        
                        // ==========================================
                        // ADMIN ONLY
                        // ==========================================
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        
                        // ==========================================
                        // FOUNDER ONLY
                        // ==========================================
                        .requestMatchers("/founder/**").hasRole("FOUNDER")
                        .requestMatchers("/founder/upload-proposal").hasRole("FOUNDER")
                        .requestMatchers("/founder/preview-ai").hasRole("FOUNDER")
                        .requestMatchers("/founder/proposals").hasRole("FOUNDER")
                        .requestMatchers("/founder/grant-access").hasRole("FOUNDER")
                        .requestMatchers("/founder/revoke-access").hasRole("FOUNDER")
                        .requestMatchers("/founder/proposal/*/access-list").hasRole("FOUNDER")
                        
                        // ==========================================
                        // MENTOR ONLY
                        // ==========================================
                        .requestMatchers("/mentor/**").hasRole("MENTOR")
                        .requestMatchers("/mentor/proposals").hasRole("MENTOR")
                        .requestMatchers("/mentor/search").hasRole("MENTOR")
                        .requestMatchers("/mentor/assigned").hasRole("MENTOR")
                        .requestMatchers("/mentor/view-proposal").hasRole("MENTOR")
                        .requestMatchers("/mentor/has-access/*").hasRole("MENTOR")
                        
                        // ==========================================
                        // INVESTOR ONLY
                        // ==========================================
                        .requestMatchers("/investor/**").hasRole("INVESTOR")
                        .requestMatchers("/investor/proposals").hasRole("INVESTOR")
                        .requestMatchers("/investor/search").hasRole("INVESTOR")
                        .requestMatchers("/investor/invested").hasRole("INVESTOR")
                        .requestMatchers("/investor/view-proposal").hasRole("INVESTOR")
                        .requestMatchers("/investor/has-access/*").hasRole("INVESTOR")
                        
                        // ==========================================
                        // MENTOR OR INVESTOR
                        // ==========================================
                        .requestMatchers("/search/**").hasAnyRole("MENTOR", "INVESTOR")
                        
                        // ==========================================
                        // RECOMMENDATIONS - ALL AUTHENTICATED USERS
                        // ==========================================
                        .requestMatchers("/recommend/**").hasAnyRole("FOUNDER", "MENTOR", "INVESTOR")
                        
                        // ==========================================
                        // ALL OTHER REQUESTS NEED AUTHENTICATION
                        // ==========================================
                        .anyRequest().authenticated()
                )
                
                // ✅ Add JWT filter before UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // ✅ Allow all origins for development (restrict in production)
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "http://10.81.121.121:3000",
                "http://10.81.121.121:5173"
        ));
        
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"
        ));
        
        configuration.setAllowedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "Accept", "X-Requested-With",
                "Cache-Control", "Origin", "Access-Control-Allow-Origin",
                "Access-Control-Allow-Headers", "Access-Control-Allow-Methods"
        ));
        
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization", "Content-Type", "Content-Disposition"
        ));
        
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}