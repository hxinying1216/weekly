package com.weekly.plan.todo;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/personal-todos")
public class PersonalTodoController {
  private final PersonalTodoService todos;

  public PersonalTodoController(PersonalTodoService todos) {
    this.todos = todos;
  }

  @GetMapping("/available-projects")
  public List<AvailableProjectResponse> availableProjects(
      @RequestHeader(value = "Authorization", required = false) String authorization
  ) {
    return todos.availableProjects(authorization);
  }

  @GetMapping("/assignees")
  public List<TeamAssigneeResponse> teamAssignees(
      @RequestHeader(value = "Authorization", required = false) String authorization
  ) {
    return todos.teamAssignees(authorization);
  }

  @GetMapping("/team")
  public List<TeamProjectResponse> teamList(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
      @RequestParam(required = false) Long assigneeId
  ) {
    return todos.teamList(authorization, startDate, endDate, assigneeId);
  }

  @GetMapping("/archive")
  public List<ArchiveProjectResponse> archiveList(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
      @RequestParam(required = false) Long assigneeId
  ) {
    return todos.archiveList(authorization, startDate, endDate, assigneeId);
  }

  @GetMapping
  public List<PersonalTodoResponse> list(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
  ) {
    return todos.list(authorization, startDate, endDate);
  }

  @PatchMapping("/{todoId}/complete")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void complete(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @PathVariable Long todoId
  ) {
    todos.complete(authorization, todoId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public PersonalTodoResponse create(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @Valid @RequestBody PersonalTodoRequest request
  ) {
    return todos.create(authorization, request);
  }
}
