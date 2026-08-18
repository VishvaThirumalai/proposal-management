package com.startuphub.backend.config;

import com.startuphub.backend.model.User;
import com.startuphub.backend.model.enums.AccountStatus;
import com.startuphub.backend.model.enums.Role;
import com.startuphub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Check if admin already exists
        if (!userRepository.findByEmail("admin123@gmail.com").isPresent()) {
            
            // Create admin user
            User admin = User.builder()
                    .name("Admin")
                    .email("admin123@gmail.com")
                    .password(passwordEncoder.encode("admin@123"))
                    .phone("9876543210")
                    .role(Role.ADMIN)
                    .status(AccountStatus.APPROVED)
                    .walletAddress(generateWalletAddress())
                    .publicKey("admin_public_key_dummy")
                    .build();

            userRepository.save(admin);
            
            System.out.println("=========================================");
            System.out.println("✅ ADMIN USER CREATED SUCCESSFULLY!");
            System.out.println("=========================================");
            System.out.println("📧 Email: admin123@gmail.com");
            System.out.println("🔑 Password: admin@123");
            System.out.println("📱 Phone: 9876543210");
            System.out.println("👤 Role: ADMIN");
            System.out.println("=========================================");
            System.out.println("⚠️  Please change the default password after first login!");
            System.out.println("=========================================");
            
        } else {
            System.out.println("✅ Admin user already exists.");
            System.out.println("📧 Email: admin123@gmail.com");
            System.out.println("🔑 Password: admin@123");
        }
    }

    private String generateWalletAddress() {
        StringBuilder sb = new StringBuilder();
        sb.append("0x");
        String chars = "0123456789abcdef";
        for (int i = 0; i < 40; i++) {
            int index = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }
}