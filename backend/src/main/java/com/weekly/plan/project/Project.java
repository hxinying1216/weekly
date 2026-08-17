package com.weekly.plan.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "projects")
public class Project {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(nullable = false, length = 80)
  private String title;
  @Column(nullable = false, length = 300)
  private String note;
  @Column(name = "created_by", nullable = false)
  private Long createdBy;
  @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;
  @UpdateTimestamp @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
  protected Project() {}
  public Project(String title, String note, Long createdBy) { this.title = title; this.note = note; this.createdBy = createdBy; }
  public Long getId() { return id; }
  public String getTitle() { return title; }
  public String getNote() { return note; }
  public Long getCreatedBy() { return createdBy; }
}
