package com.weekly.plan.todo;

import java.time.LocalDate;

public record TeamSubtaskResponse(Long id, String note, String assignee, LocalDate dueDate) {}
