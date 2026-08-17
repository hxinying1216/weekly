package com.weekly.plan.auth;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class SessionService {
  private final ConcurrentHashMap<String, Long> userIdByToken = new ConcurrentHashMap<>();

  public String issueFor(User user) {
    String token = UUID.randomUUID().toString();
    userIdByToken.put(token, user.getId());
    return token;
  }

  public Optional<Long> userIdFor(String token) {
    return Optional.ofNullable(userIdByToken.get(token));
  }
}
