package com.weekly.plan.auth;

public record UserProfileResponse(Long id, String username, String phone, UserRole role) {
  static UserProfileResponse from(User user) {
    return new UserProfileResponse(user.getId(), user.getUsername(), user.getPhone(), user.getRole());
  }
}
