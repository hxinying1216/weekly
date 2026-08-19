package com.weekly.plan.todo;

import com.weekly.plan.auth.SessionService;
import com.weekly.plan.auth.User;
import com.weekly.plan.auth.UserRepository;
import com.weekly.plan.auth.UserRole;
import com.weekly.plan.project.Project;
import com.weekly.plan.project.ProjectRepository;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PersonalTodoService {
  private final PersonalTodoRepository todos;
  private final ProjectRepository projects;
  private final UserRepository users;
  private final SessionService sessions;

  public PersonalTodoService(
      PersonalTodoRepository todos,
      ProjectRepository projects,
      UserRepository users,
      SessionService sessions
  ) {
    this.todos = todos;
    this.projects = projects;
    this.users = users;
    this.sessions = sessions;
  }

  public List<AvailableProjectResponse> availableProjects(String authorization) {
    requireUser(authorization);
    return projects.findAllByOrderByCreatedAtDescIdDesc().stream()
        .map(project -> new AvailableProjectResponse(
            project.getId(), project.getTitle(), project.getNote(), creatorName(project)))
        .toList();
  }

  public List<PersonalTodoResponse> list(String authorization, LocalDate startDate, LocalDate endDate) {
    User user = requireUser(authorization);
    validateDateRange(startDate, endDate);
    return validRecords(todos.findAllByAssigneeIdAndDueDateBetweenAndCompletedAtIsNullOrderByDueDateAscIdDesc(
            user.getId(), startDate, endDate))
        .stream()
        .map(this::responseOf)
        .toList();
  }

  public List<TeamAssigneeResponse> teamAssignees(String authorization) {
    requireUser(authorization);
    return users.findAllByOrderByUsernameAsc().stream()
        .map(user -> new TeamAssigneeResponse(user.getId(), user.getUsername()))
        .toList();
  }

  public List<TeamProjectResponse> teamList(
      String authorization, LocalDate startDate, LocalDate endDate, Long assigneeId) {
    requireUser(authorization);
    validateDateRange(startDate, endDate);
    requireAssigneeWhenPresent(assigneeId);
    List<PersonalTodo> records = assigneeId == null
        ? todos.findAllByDueDateBetweenAndCompletedAtIsNullOrderByDueDateAscIdDesc(startDate, endDate)
        : todos.findAllByAssigneeIdAndDueDateBetweenAndCompletedAtIsNullOrderByDueDateAscIdDesc(
            assigneeId, startDate, endDate);
    records = validRecords(records);
    Map<Long, Project> projectsById = projectsFor(records);
    Map<Long, User> usersById = usersFor(records, projectsById);
    return records.stream()
        .collect(Collectors.groupingBy(PersonalTodo::getProjectId, LinkedHashMap::new, Collectors.toList()))
        .entrySet()
        .stream()
        .map(entry -> teamProjectOf(entry.getValue(), projectsById.get(entry.getKey()), usersById))
        .toList();
  }

  public void complete(String authorization, Long todoId) {
    User user = requireUser(authorization);
    PersonalTodo todo = todos.findById(todoId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "待办不存在"));
    if (!todo.getAssigneeId().equals(user.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能完成自己接取的待办");
    }
    if (!todo.isCompleted()) {
      todo.complete(LocalDate.now());
      todos.save(todo);
    }
  }

  public PersonalTodoResponse update(String authorization, Long todoId, PersonalTodoRequest request) {
    User user = requireUser(authorization);
    PersonalTodo todo = todos.findById(todoId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "待办不存在"));
    if (!todo.getAssigneeId().equals(user.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只能修改自己接取的待办");
    }
    if (todo.isCompleted()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "已完成的待办不能修改");
    }
    Project project = projects.findById(request.projectId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "主任务不存在"));
    todo.update(project.getId(), request.dueDate(), request.note().trim());
    return responseOf(todos.save(todo));
  }

  public List<ArchiveProjectResponse> archiveList(
      String authorization, LocalDate startDate, LocalDate endDate, Long assigneeId) {
    User user = requireUser(authorization);
    validateDateRange(startDate, endDate);
    requireAssigneeWhenPresent(assigneeId);
    Long effectiveAssigneeId = user.getRole() == UserRole.ADMIN ? assigneeId : user.getId();
    List<PersonalTodo> records = effectiveAssigneeId == null
        ? todos.findAllByCompletedAtBetweenOrderByCompletedAtDescIdDesc(startDate, endDate)
        : todos.findAllByAssigneeIdAndCompletedAtBetweenOrderByCompletedAtDescIdDesc(
            effectiveAssigneeId, startDate, endDate);
    records = validRecords(records);
    Map<Long, Project> projectsById = projectsFor(records);
    Map<Long, User> usersById = usersFor(records, projectsById);
    return records.stream()
        .collect(Collectors.groupingBy(PersonalTodo::getProjectId, LinkedHashMap::new, Collectors.toList()))
        .entrySet()
        .stream()
        .map(entry -> archiveProjectOf(entry.getValue(), projectsById.get(entry.getKey()), usersById))
        .toList();
  }

  public PersonalTodoResponse create(String authorization, PersonalTodoRequest request) {
    User user = requireUser(authorization);
    Project project = projects.findById(request.projectId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "主任务不存在"));
    String personalNote = request.note().trim();
    PersonalTodo todo = todos.save(new PersonalTodo(project.getId(), user.getId(), request.dueDate(), personalNote));
    return responseOf(todo);
  }

  private TeamProjectResponse teamProjectOf(
      List<PersonalTodo> subtasks, Project project, Map<Long, User> usersById) {
    List<TeamSubtaskResponse> children = subtasks.stream()
        .map(todo -> new TeamSubtaskResponse(
            todo.getId(), todo.getPersonalNote(), userOf(usersById, todo.getAssigneeId()).getUsername(), todo.getDueDate()))
        .toList();
    return new TeamProjectResponse(
        project.getId(), project.getTitle(), userOf(usersById, project.getCreatedBy()).getUsername(),
        project.getNote(), children);
  }

  private ArchiveProjectResponse archiveProjectOf(
      List<PersonalTodo> subtasks, Project project, Map<Long, User> usersById) {
    List<ArchiveSubtaskResponse> children = subtasks.stream()
        .map(todo -> new ArchiveSubtaskResponse(
            todo.getId(), todo.getPersonalNote(), userOf(usersById, todo.getAssigneeId()).getUsername(), todo.getCompletedAt()))
        .toList();
    return new ArchiveProjectResponse(
        project.getId(), project.getTitle(), userOf(usersById, project.getCreatedBy()).getUsername(),
        project.getNote(), children);
  }

  private List<PersonalTodo> validRecords(List<PersonalTodo> records) {
    Map<Long, Project> projectsById = projectsFor(records);
    List<PersonalTodo> projectBackedRecords = records.stream()
        .filter(todo -> projectsById.containsKey(todo.getProjectId()))
        .toList();
    Map<Long, User> usersById = users.findAllById(projectBackedRecords.stream()
            .flatMap(todo -> Stream.of(
                todo.getAssigneeId(), projectsById.get(todo.getProjectId()).getCreatedBy()))
            .distinct()
            .toList())
        .stream()
        .collect(Collectors.toMap(User::getId, Function.identity()));
    return projectBackedRecords.stream()
        .filter(todo -> usersById.containsKey(todo.getAssigneeId()))
        .filter(todo -> usersById.containsKey(projectsById.get(todo.getProjectId()).getCreatedBy()))
        .toList();
  }

  private Map<Long, Project> projectsFor(List<PersonalTodo> records) {
    return projects.findAllById(records.stream().map(PersonalTodo::getProjectId).distinct().toList()).stream()
        .collect(Collectors.toMap(Project::getId, Function.identity()));
  }

  private Map<Long, User> usersFor(List<PersonalTodo> records, Map<Long, Project> projectsById) {
    return users.findAllById(records.stream()
            .flatMap(todo -> Stream.of(todo.getAssigneeId(), projectOf(projectsById, todo.getProjectId()).getCreatedBy()))
            .distinct()
            .toList())
        .stream()
        .collect(Collectors.toMap(User::getId, Function.identity()));
  }

  private Project projectOf(Map<Long, Project> projectsById, Long projectId) {
    Project project = projectsById.get(projectId);
    if (project == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "主任务不存在");
    return project;
  }

  private User userOf(Map<Long, User> usersById, Long userId) {
    User user = usersById.get(userId);
    if (user == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在");
    return user;
  }

  private PersonalTodoResponse responseOf(PersonalTodo todo) {
    User assignee = users.findById(todo.getAssigneeId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "接取人不存在"));
    Project project = projects.findById(todo.getProjectId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "主任务不存在"));
    String note = "项目备注：" + project.getNote() + "\n个人备注：" + todo.getPersonalNote();
    return new PersonalTodoResponse(
        todo.getId(), todo.getProjectId(), todo.getAssigneeId(), project.getTitle(), note,
        todo.getDueDate(), assignee.getUsername());
  }

  private String creatorName(Project project) {
    return users.findById(project.getCreatedBy()).map(User::getUsername).orElse("未知用户");
  }

  private void validateDateRange(LocalDate startDate, LocalDate endDate) {
    if (startDate.isAfter(endDate)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "开始日期不能晚于结束日期");
    }
  }

  private void requireAssigneeWhenPresent(Long assigneeId) {
    if (assigneeId != null && users.findById(assigneeId).isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "成员不存在");
    }
  }

  private User requireUser(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录");
    }
    Long id = sessions.userIdFor(authorization.substring(7))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录已失效，请重新登录"));
    return users.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录已失效，请重新登录"));
  }
}
