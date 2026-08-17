package com.weekly.plan.todo;

import java.time.LocalDate;

public record ArchiveSubtaskResponse(Long id, String note, String assignee, LocalDate completedAt) {}
