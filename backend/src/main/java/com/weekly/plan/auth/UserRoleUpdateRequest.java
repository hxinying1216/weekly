package com.weekly.plan.auth;

import jakarta.validation.constraints.NotNull;

public record UserRoleUpdateRequest(
    @NotNull(message = "请选择用户角色")
    UserRole role
) {}
