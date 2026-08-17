package com.weekly.plan.todo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record PersonalTodoRequest(
    @NotNull(message = "请选择父任务") Long projectId,
    @NotNull(message = "请选择截止日期") LocalDate dueDate,
    @NotBlank(message = "请输入个人备注") @Size(max = 300, message = "个人备注不能超过 300 个字符") String note
) {}
