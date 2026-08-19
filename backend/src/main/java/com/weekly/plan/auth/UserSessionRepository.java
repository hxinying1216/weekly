package com.weekly.plan.auth;

import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
  Optional<UserSession> findByTokenHashAndExpiresAtAfter(String tokenHash, LocalDateTime now);
  void deleteByUserId(Long userId);
  void deleteByExpiresAtBefore(LocalDateTime now);
}
