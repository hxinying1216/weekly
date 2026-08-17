package com.weekly.plan.auth;

public record ManagedUserResponse(Long id, String username, UserRole role) {
  static ManagedUserResponse from(User user) {
    return new ManagedUserResponse(user.getId(), user.getUsername(), user.getRole());
  }
}
