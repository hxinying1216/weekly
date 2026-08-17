package com.weekly.plan.todo;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "personal_todos")
public class PersonalTodo {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(name = "project_id", nullable = false)
  private Long projectId;
  @Column(name = "assignee_id", nullable = false)
  private Long assigneeId;
  @Column(name = "due_date", nullable = false)
  private LocalDate dueDate;
  @Column(name = "personal_note", nullable = false, length = 300)
  private String personalNote;
  @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
  @UpdateTimestamp @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  protected PersonalTodo() {}

  public PersonalTodo(Long projectId, Long assigneeId, LocalDate dueDate, String personalNote) {
    this.projectId = projectId;
    this.assigneeId = assigneeId;
    this.dueDate = dueDate;
    this.personalNote = personalNote;
  }

  public Long getId() { return id; }
  public Long getProjectId() { return projectId; }
  public Long getAssigneeId() { return assigneeId; }
  public LocalDate getDueDate() { return dueDate; }
  public String getPersonalNote() { return personalNote; }
}
