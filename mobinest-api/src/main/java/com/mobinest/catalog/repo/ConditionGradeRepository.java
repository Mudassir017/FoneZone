package com.mobinest.catalog.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mobinest.catalog.domain.ConditionGrade;

public interface ConditionGradeRepository extends JpaRepository<ConditionGrade, String> {

    List<ConditionGrade> findAllByOrderBySortOrderAsc();
}
