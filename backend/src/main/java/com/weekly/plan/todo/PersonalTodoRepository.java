package com.weekly.plan.todo;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonalTodoRepository extends JpaRepository<PersonalTodo, Long> {
  List<PersonalTodo> findAllByDueDateBetweenOrderByDueDateAscIdDesc(
      LocalDate startDate, LocalDate endDate);

  List<PersonalTodo> findAllByAssigneeIdAndDueDateBetweenOrderByDueDateAscIdDesc(
      Long assigneeId, LocalDate startDate, LocalDate endDate);
}
