package com.weekly.plan.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserProfileUpdateRequest(
    @NotBlank(message = "昵称不能为空")
    @Size(min = 3, max = 32, message = "昵称长度应为 3 到 32 位")
    @Pattern(regexp = "^[\\p{L}\\p{N}_-]+$", message = "昵称仅支持汉字、字母、数字、下划线和连字符")
    String username,
    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "请输入有效手机号")
    String phone
) {}
