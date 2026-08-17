package com.weekly.plan.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
  private final UserRepository users;
  private final SessionService sessions;
  private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public AuthService(UserRepository users, SessionService sessions) {
    this.users = users;
    this.sessions = sessions;
  }

  public AuthResponse register(CredentialsRequest request) {
    String username = normalized(request.username());
    if (users.existsByUsername(username)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已被注册");
    }

    User user = users.save(new User(username, passwordEncoder.encode(request.password()), UserRole.USER));
    return AuthResponse.from(user, sessions.issueFor(user));
  }

  public AuthResponse login(CredentialsRequest request) {
    User user = users.findByUsername(normalized(request.username()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
    }

    return AuthResponse.from(user, sessions.issueFor(user));
  }

  private String normalized(String username) {
    return username.trim();
  }
}
