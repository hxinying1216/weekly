package com.weekly.plan.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
    @NotBlank(message = "请输入任务名称") @Size(max = 80, message = "任务名称不能超过 80 个字符") String title,
    @Size(max = 300, message = "任务备注不能超过 300 个字符") String note
) {}
