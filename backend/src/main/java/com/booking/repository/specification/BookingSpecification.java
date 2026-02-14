package com.booking.repository.specification;

import com.booking.dto.AdminBookingSearchRequest;
import com.booking.entity.Booking;
import com.booking.entity.Station;
import com.booking.entity.Train;
import com.booking.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class BookingSpecification {

    public static Specification<Booking> withFilters(AdminBookingSearchRequest req) {

        return (root, query, cb) -> {

            List<Predicate> predicates = new ArrayList<>();

            Join<Booking, User> userJoin = root.join("user", JoinType.LEFT);
            Join<Booking, Train> trainJoin = root.join("train", JoinType.LEFT);
            Join<Booking, Station> bookingSourceJoin = root.join("sourceStation", JoinType.LEFT);
            Join<Booking, Station> bookingDestinationJoin = root.join("destinationStation", JoinType.LEFT);

            if (req.getUsername() != null && !req.getUsername().isBlank()) {
                predicates.add(cb.like(
                        cb.lower(userJoin.get("username")),
                        "%" + req.getUsername().toLowerCase() + "%"
                ));
            }

            if (req.getTrainNumber() != null && !req.getTrainNumber().isBlank()) {
                predicates.add(cb.equal(
                        trainJoin.get("trainNumber"),
                        req.getTrainNumber()
                ));
            }

            if (req.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), req.getStatus()));
            }

            if (req.getSourceStation() != null && !req.getSourceStation().isBlank()) {
                String sourceStation = req.getSourceStation().trim().toLowerCase();
                predicates.add(cb.or(
                        cb.equal(cb.lower(bookingSourceJoin.get("name")), sourceStation),
                        cb.equal(cb.lower(trainJoin.get("sourceStation").get("name")), sourceStation)
                ));
            }

            if (req.getDestinationStation() != null && !req.getDestinationStation().isBlank()) {
                String destinationStation = req.getDestinationStation().trim().toLowerCase();
                predicates.add(cb.or(
                        cb.equal(cb.lower(bookingDestinationJoin.get("name")), destinationStation),
                        cb.equal(cb.lower(trainJoin.get("destinationStation").get("name")), destinationStation)
                ));
            }

            if (req.getTravelFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("travelDate"),
                        req.getTravelFromDate()
                ));
            }

            if (req.getTravelToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("travelDate"),
                        req.getTravelToDate()
                ));
            }

            if (req.getBookingFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("createdAt"),
                        req.getBookingFromDate().atStartOfDay()
                ));
            }

            if (req.getBookingToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("createdAt"),
                        req.getBookingToDate().atTime(23, 59, 59)
                ));
            }

            if (req.getMinSeatsBooked() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("seatsBooked"),
                        req.getMinSeatsBooked()
                ));
            }

            if (req.getMaxSeatsBooked() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("seatsBooked"),
                        req.getMaxSeatsBooked()
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
