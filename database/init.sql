CREATE DATABASE IF NOT EXISTS weekly_plan
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE weekly_plan;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  phone VARCHAR(11) NULL,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'USER',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 项目表存储管理员创建的大任务，后续普通用户子任务可关联 projects.id。
CREATE TABLE IF NOT EXISTS projects (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(80) NOT NULL,
  note VARCHAR(300) NOT NULL DEFAULT '',
  created_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_projects_created_by (created_by),
  CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 个人待办仅保存父任务关联和个人补充信息；展示时由服务端合并父任务内容。
CREATE TABLE IF NOT EXISTS personal_todos (
  id BIGINT NOT NULL AUTO_INCREMENT,
  project_id BIGINT NOT NULL,
  assignee_id BIGINT NOT NULL,
  due_date DATE NOT NULL,
  personal_note VARCHAR(300) NOT NULL,
  completed_at DATE NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_personal_todos_assignee_due_date (assignee_id, due_date),
  KEY idx_personal_todos_due_date (due_date),
  KEY idx_personal_todos_completed_at (completed_at),
  KEY idx_personal_todos_project_id (project_id),
  CONSTRAINT fk_personal_todos_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_personal_todos_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户名使用 utf8mb4_bin，大小写不同的账号可同时存在。
-- 示例：
-- INSERT INTO users (username, password_hash, role)
-- VALUES ('admin', '$2a$10$替换为实际 BCrypt 密文', 'ADMIN');
