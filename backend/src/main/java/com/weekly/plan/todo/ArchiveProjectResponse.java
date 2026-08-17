package com.weekly.plan.todo;

import java.util.List;

public record ArchiveProjectResponse(
    Long id,
    String title,
    String creator,
    String note,
    List<ArchiveSubtaskResponse> subtasks
) {}
