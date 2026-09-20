package com.Rent_Management.security;

import com.Rent_Management.entity.Admin;
import com.Rent_Management.entity.User;
import com.Rent_Management.repository.AdminRepository;
import com.Rent_Management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        // 1. Check member user table first
        Optional<User> userOpt = userRepository.findByUsernameOrEmail(identifier, identifier);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return new org.springframework.security.core.userdetails.User(
                    user.getUsername(),
                    user.getPassword(),
                    user.isActive(),
                    true,
                    true,
                    true,
                    Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
            );
        }

        // 2. Check administrative user table (admin)
        Optional<Admin> adminOpt = adminRepository.findByGmail(identifier)
                .or(() -> adminRepository.findByMobileNumber(identifier));
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            String roleName = admin.getRole();
            if (roleName == null || roleName.isBlank()) {
                roleName = "ROLE_ADMIN";
            } else if (!roleName.startsWith("ROLE_")) {
                roleName = "ROLE_" + roleName;
            }
            return new org.springframework.security.core.userdetails.User(
                    admin.getGmail(),
                    admin.getPassword(),
                    admin.isActive(),
                    true,
                    true,
                    true,
                    Collections.singletonList(new SimpleGrantedAuthority(roleName))
            );
        }

        throw new UsernameNotFoundException("Principal not found with identifier: " + identifier);
    }
}

