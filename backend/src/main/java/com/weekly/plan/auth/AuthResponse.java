package com.weekly.plan.auth;

public record AuthResponse(Long id, String username, UserRole role, String accessToken) {
  static AuthResponse from(User user, String accessToken) {
    return new AuthResponse(user.getId(), user.getUsername(), user.getRole(), accessToken);
  }
}
