package com.weekly.plan.todo;

import com.weekly.plan.auth.SessionService;
import com.weekly.plan.auth.User;
import com.weekly.plan.auth.UserRepository;
import com.weekly.plan.project.Project;
import com.weekly.plan.project.ProjectRepository;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
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
    if (startDate.isAfter(endDate)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "开始日期不能晚于结束日期");
    }
    return todos.findAllByAssigneeIdAndDueDateBetweenOrderByDueDateAscIdDesc(
            user.getId(), startDate, endDate)
        .stream()
        .map(todo -> responseOf(todo))
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
    if (startDate.isAfter(endDate)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "开始日期不能晚于结束日期");
    }
    if (assigneeId != null && users.findById(assigneeId).isEmpty()) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "成员不存在");
    }
    List<PersonalTodo> records = assigneeId == null
        ? todos.findAllByDueDateBetweenOrderByDueDateAscIdDesc(startDate, endDate)
        : todos.findAllByAssigneeIdAndDueDateBetweenOrderByDueDateAscIdDesc(
            assigneeId, startDate, endDate);
    Map<Long, Project> projectsById = projects.findAllById(records.stream()
            .map(PersonalTodo::getProjectId)
            .toList())
        .stream()
        .collect(Collectors.toMap(Project::getId, Function.identity()));
    Map<Long, User> usersById = users.findAllById(records.stream()
            .flatMap(todo -> java.util.stream.Stream.of(todo.getAssigneeId(), projectsById.get(todo.getProjectId()).getCreatedBy()))
            .distinct()
            .toList())
        .stream()
        .collect(Collectors.toMap(User::getId, Function.identity()));
    return records.stream()
        .collect(Collectors.groupingBy(PersonalTodo::getProjectId, LinkedHashMap::new, Collectors.toList()))
        .entrySet()
        .stream()
        .map(entry -> teamProjectOf(entry.getValue(), projectsById.get(entry.getKey()), usersById))
        .toList();
  }

  public PersonalTodoResponse create(String authorization, PersonalTodoRequest request) {
    User user = requireUser(authorization);
    Project project = projects.findById(request.projectId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "父任务不存在"));
    String personalNote = request.note().trim();
    PersonalTodo todo = todos.save(new PersonalTodo(project.getId(), user.getId(), request.dueDate(), personalNote));
    return responseOf(todo);
  }

  private TeamProjectResponse teamProjectOf(
      List<PersonalTodo> subtasks,
      Project project,
      Map<Long, User> usersById
  ) {
    List<TeamSubtaskResponse> children = subtasks.stream()
        .map(todo -> new TeamSubtaskResponse(
            todo.getId(),
            todo.getPersonalNote(),
            usersById.get(todo.getAssigneeId()).getUsername(),
            todo.getDueDate()))
        .toList();
    return new TeamProjectResponse(
        project.getId(),
        project.getTitle(),
        usersById.get(project.getCreatedBy()).getUsername(),
        project.getNote(),
        children);
  }

  private PersonalTodoResponse responseOf(PersonalTodo todo) {
    User assignee = users.findById(todo.getAssigneeId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "接取人不存在"));
    Project project = projects.findById(todo.getProjectId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "父任务不存在"));
    String note = "主备注：" + project.getNote()
        + "\n子备注：" + todo.getPersonalNote();
    return new PersonalTodoResponse(
        todo.getId(), todo.getProjectId(), todo.getAssigneeId(), project.getTitle(), note,
        todo.getDueDate(), assignee.getUsername());
  }

  private String creatorName(Project project) {
    return users.findById(project.getCreatedBy()).map(User::getUsername).orElse("未知用户");
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
