package com.weekly.plan.auth;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {
  private final UserProfileService profiles;

  public UserProfileController(UserProfileService profiles) {
    this.profiles = profiles;
  }

  @GetMapping("/phone")
  public PhoneLookupResponse phone(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @RequestParam String username
  ) {
    return profiles.phone(authorization, username);
  }

  @GetMapping
  public UserProfileResponse get(
      @RequestHeader(value = "Authorization", required = false) String authorization
  ) {
    return profiles.get(authorization);
  }

  @PatchMapping
  public UserProfileResponse update(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @Valid @RequestBody UserProfileUpdateRequest request
  ) {
    return profiles.update(authorization, request);
  }
}
