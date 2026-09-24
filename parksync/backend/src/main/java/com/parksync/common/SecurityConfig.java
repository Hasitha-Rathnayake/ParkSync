package com.parksync.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

// NOTE: Spring Security is included only for BCryptPasswordEncoder (password
// hashing). We are NOT implementing full session/JWT-based authentication in
// this phase (that was scoped out as a "harder" stretch feature). This config
// disables Security's default "block everything" behaviour so the REST API
// stays open for the demo, while registration/login still hash passwords
// properly. If your team later adds real JWT auth, replace this permitAll
// filter chain with real authorization rules.
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
