package com.weekly.plan.auth;

import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserManagementService {
  private final UserRepository users;
  private final SessionService sessions;
  private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public UserManagementService(UserRepository users, SessionService sessions) {
    this.users = users;
    this.sessions = sessions;
  }

  public List<ManagedUserResponse> list(String authorization) {
    requireAdmin(authorization);
    return users.findAll(Sort.by(Sort.Direction.ASC, "username"))
        .stream()
        .map(ManagedUserResponse::from)
        .toList();
  }

  public ManagedUserResponse create(String authorization, ManagedUserCreateRequest request) {
    requireAdmin(authorization);
    if (users.existsByUsername(request.username())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被注册");
    }

    User user = users.save(new User(
        request.username(),
        passwordEncoder.encode(request.password()),
        request.role()
    ));
    return ManagedUserResponse.from(user);
  }

  public ManagedUserResponse update(String authorization, Long userId, ManagedUserUpdateRequest request) {
    requireAdmin(authorization);
    User user = userById(userId);
    String username = request.username().trim();
    if (!username.equals(user.getUsername()) && users.existsByUsername(username)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被注册");
    }

    user.setUsername(username);
    user.setRole(request.role());
    boolean passwordChanged = !request.password().isEmpty();
    if (passwordChanged) {
      user.setPasswordHash(passwordEncoder.encode(request.password()));
    }
    ManagedUserResponse response = ManagedUserResponse.from(users.save(user));
    if (passwordChanged) {
      sessions.invalidateFor(userId);
    }
    return response;
  }

  public ManagedUserResponse updateRole(String authorization, Long userId, UserRoleUpdateRequest request) {
    requireAdmin(authorization);
    User user = userById(userId);
    user.setRole(request.role());
    return ManagedUserResponse.from(users.save(user));
  }

  public void delete(String authorization, Long userId) {
    requireAdmin(authorization);
    sessions.invalidateFor(userId);
    users.delete(userById(userId));
  }

  private User requireAdmin(String authorization) {
    String token = bearerToken(authorization);
    Long userId = sessions.userIdFor(token)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录已失效，请重新登录"));
    User user = userById(userId);
    if (user.getRole() != UserRole.ADMIN) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "仅管理员可使用用户管理功能");
    }
    return user;
  }

  private String bearerToken(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录");
    }
    return authorization.substring("Bearer ".length());
  }

  private User userById(Long userId) {
    return users.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
  }
}
