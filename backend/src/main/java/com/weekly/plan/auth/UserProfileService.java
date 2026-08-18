package com.weekly.plan.auth;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserProfileService {
  private final UserRepository users;
  private final SessionService sessions;

  public UserProfileService(UserRepository users, SessionService sessions) {
    this.users = users;
    this.sessions = sessions;
  }

  public UserProfileResponse get(String authorization) {
    return UserProfileResponse.from(currentUser(authorization));
  }

  public UserProfileResponse update(String authorization, UserProfileUpdateRequest request) {
    User user = currentUser(authorization);
    String username = request.username().trim();
    if (!username.equals(user.getUsername()) && users.existsByUsername(username)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "昵称已被使用，请更换昵称");
    }

    user.setUsername(username);
    user.setPhone(request.phone().trim());
    return UserProfileResponse.from(users.save(user));
  }

  public PhoneLookupResponse phone(String authorization, String username) {
    currentUser(authorization);
    String normalizedUsername = username == null ? "" : username.trim();
    if (normalizedUsername.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请输入昵称");
    }
    User user = users.findByUsername(normalizedUsername)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "未找到该昵称"));
    return new PhoneLookupResponse(user.getUsername(), user.getPhone());
  }

  private User currentUser(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录");
    }
    Long userId = sessions.userIdFor(authorization.substring(7))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录已失效，请重新登录"));
    return users.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录已失效，请重新登录"));
  }
}
