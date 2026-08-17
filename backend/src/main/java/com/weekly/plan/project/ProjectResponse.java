package com.weekly.plan.project;

public record ProjectResponse(Long id, String title, String note, String creator) {
  static ProjectResponse from(Project project, String creator) {
    return new ProjectResponse(project.getId(), project.getTitle(), project.getNote(), creator);
  }
}
