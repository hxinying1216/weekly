package com.weekly.plan.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {
  private static final int SESSION_VALID_DAYS = 30;

  private final UserSessionRepository sessions;

  public SessionService(UserSessionRepository sessions) {
    this.sessions = sessions;
  }

  @Transactional
  public String issueFor(User user) {
    LocalDateTime now = LocalDateTime.now();
    String token = UUID.randomUUID().toString();
    sessions.deleteByExpiresAtBefore(now);
    sessions.save(new UserSession(tokenHash(token), user.getId(), now.plusDays(SESSION_VALID_DAYS)));
    return token;
  }

  public Optional<Long> userIdFor(String token) {
    return sessions.findByTokenHashAndExpiresAtAfter(tokenHash(token), LocalDateTime.now())
        .map(UserSession::getUserId);
  }

  @Transactional
  public void invalidateFor(Long userId) {
    sessions.deleteByUserId(userId);
  }

  private String tokenHash(String token) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException error) {
      throw new IllegalStateException("SHA-256 不可用", error);
    }
  }
}
