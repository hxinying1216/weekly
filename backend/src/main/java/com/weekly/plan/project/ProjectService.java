package com.weekly.plan.project;

import com.weekly.plan.auth.SessionService;
import com.weekly.plan.auth.User;
import com.weekly.plan.auth.UserRepository;
import com.weekly.plan.auth.UserRole;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProjectService {
  private final ProjectRepository projects;
  private final UserRepository users;
  private final SessionService sessions;
  public ProjectService(ProjectRepository projects, UserRepository users, SessionService sessions) { this.projects = projects; this.users = users; this.sessions = sessions; }
  public List<ProjectResponse> list(String authorization) {
    requireAdmin(authorization);
    return projects.findAllByOrderByCreatedAtDescIdDesc().stream()
        .map(project -> ProjectResponse.from(project, creatorName(project)))
        .toList();
  }

  public ProjectResponse create(String authorization, ProjectRequest request) {
    User admin = requireAdmin(authorization);
    String title = request.title().trim();
    if (title.isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请输入任务名称");
    }
    String note = request.note() == null ? "" : request.note().trim();
    return ProjectResponse.from(projects.save(new Project(title, note, admin.getId())), admin.getUsername());
  }
  public void delete(String authorization, Long id) { requireAdmin(authorization); projects.delete(projects.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "任务不存在"))); }

  private String creatorName(Project project) {
    return users.findById(project.getCreatedBy()).map(User::getUsername).orElse("未知用户");
  }
  private User requireAdmin(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer ")) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录");
    Long id = sessions.userIdFor(authorization.substring(7)).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录已失效，请重新登录"));
    User user = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "登录已失效，请重新登录"));
    if (user.getRole() != UserRole.ADMIN) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "仅管理员可管理任务");
    return user;
  }
}
