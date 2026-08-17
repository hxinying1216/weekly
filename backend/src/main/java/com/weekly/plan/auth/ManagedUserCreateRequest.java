package com.weekly.plan.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ManagedUserCreateRequest(
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 32, message = "用户名长度应为 3 到 32 位")
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "用户名仅支持字母、数字、下划线和连字符")
    String username,
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 72, message = "密码长度应为 6 到 72 位")
    String password,
    @NotNull(message = "请选择用户角色")
    UserRole role
) {}
