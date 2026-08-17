package com.weekly.plan.todo;

import java.util.List;

public record TeamProjectResponse(
    Long id,
    String title,
    String creator,
    String note,
    List<TeamSubtaskResponse> subtasks
) {}
