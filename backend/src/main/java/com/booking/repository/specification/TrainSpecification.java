package com.booking.repository.specification;

import com.booking.entity.Station;
import com.booking.entity.Train;
import com.booking.entity.TrainStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class TrainSpecification {

    public static Specification<Train> withFilters(
            String trainNumber,
            String trainName,
            String sourceStation,
            String destinationStation,
            TrainStatus status,
            LocalDate createdFrom,
            LocalDate createdTo
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            Join<Train, Station> sourceJoin = root.join("sourceStation", JoinType.LEFT);
            Join<Train, Station> destinationJoin = root.join("destinationStation", JoinType.LEFT);

            if (trainNumber != null && !trainNumber.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("trainNumber")),
                        "%" + trainNumber.trim().toLowerCase() + "%"
                ));
            }

            if (trainName != null && !trainName.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("trainName")),
                        "%" + trainName.trim().toLowerCase() + "%"
                ));
            }

            if (sourceStation != null && !sourceStation.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(sourceJoin.get("name")),
                        "%" + sourceStation.trim().toLowerCase() + "%"
                ));
            }

            if (destinationStation != null && !destinationStation.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(destinationJoin.get("name")),
                        "%" + destinationStation.trim().toLowerCase() + "%"
                ));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (createdFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("createdAt"),
                        createdFrom.atStartOfDay()
                ));
            }

            if (createdTo != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("createdAt"),
                        createdTo.atTime(23, 59, 59)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
