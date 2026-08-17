package com.weekly.plan.todo;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonalTodoRepository extends JpaRepository<PersonalTodo, Long> {
  List<PersonalTodo> findAllByDueDateBetweenAndCompletedAtIsNullOrderByDueDateAscIdDesc(
      LocalDate startDate, LocalDate endDate);

  List<PersonalTodo> findAllByAssigneeIdAndDueDateBetweenAndCompletedAtIsNullOrderByDueDateAscIdDesc(
      Long assigneeId, LocalDate startDate, LocalDate endDate);

  List<PersonalTodo> findAllByCompletedAtBetweenOrderByCompletedAtDescIdDesc(
      LocalDate startDate, LocalDate endDate);

  List<PersonalTodo> findAllByAssigneeIdAndCompletedAtBetweenOrderByCompletedAtDescIdDesc(
      Long assigneeId, LocalDate startDate, LocalDate endDate);
}
