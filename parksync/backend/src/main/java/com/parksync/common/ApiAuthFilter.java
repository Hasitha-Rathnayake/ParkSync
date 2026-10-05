package com.parksync.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Lightweight API gate for the student demo.
 * Public endpoints stay open; everything else requires X-User-Id
 * (sent by the frontend after login). Not a full JWT system — blocks
 * casual unauthenticated API use from the browser.
 */
@Component
@Order(1)
public class ApiAuthFilter extends OncePerRequestFilter {

    private static final Set<String> PUBLIC_PREFIXES = Set.of(
            "/api/users/login",
            "/api/users/register",
            "/api/stats/",
            "/uploads/"
    );

    private static boolean isPublic(HttpServletRequest req) {
        String path = req.getRequestURI();
        String method = req.getMethod();
        if (HttpMethod.OPTIONS.matches(method)) return true; // CORS preflight
        for (String p : PUBLIC_PREFIXES) {
            if (path.startsWith(p)) return true;
        }
        // Public GET lots list for browsing before login (optional read-only)
        if (HttpMethod.GET.matches(method) && (path.equals("/api/lots") || path.matches("/api/lots/\\d+"))) {
            return true;
        }
        if (HttpMethod.GET.matches(method) && path.startsWith("/api/packages/active")) {
            return true;
        }
        if (HttpMethod.GET.matches(method) && path.matches("/api/packages/lot/\\d+/active.*")) {
            return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/") || isPublic(request)) {
            chain.doFilter(request, response);
            return;
        }
        String userId = request.getHeader("X-User-Id");
        if (userId == null || userId.isBlank()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Please log in to continue.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
