package com.weekly.plan.auth;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserManagementController {
  private final UserManagementService users;

  public UserManagementController(UserManagementService users) {
    this.users = users;
  }

  @GetMapping
  public List<ManagedUserResponse> list(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return users.list(authorization);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ManagedUserResponse create(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @Valid @RequestBody ManagedUserCreateRequest request
  ) {
    return users.create(authorization, request);
  }

  @PatchMapping("/{userId}")
  public ManagedUserResponse update(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @PathVariable Long userId,
      @Valid @RequestBody ManagedUserUpdateRequest request
  ) {
    return users.update(authorization, userId, request);
  }

  @PatchMapping("/{userId}/role")
  public ManagedUserResponse updateRole(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @PathVariable Long userId,
      @Valid @RequestBody UserRoleUpdateRequest request
  ) {
    return users.updateRole(authorization, userId, request);
  }

  @DeleteMapping("/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @PathVariable Long userId
  ) {
    users.delete(authorization, userId);
  }
}
