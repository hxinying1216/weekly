package com.weekly.plan.todo;

import java.time.LocalDate;

public record PersonalTodoResponse(
    Long id,
    Long projectId,
    Long assigneeId,
    String title,
    String note,
    LocalDate dueDate,
    String assignee
) {}
