package com.booking.repository;

import com.booking.entity.Train;
import com.booking.entity.TrainSeatAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface TrainSeatAvailabilityRepository
        extends JpaRepository<TrainSeatAvailability, Long> {

    Optional<TrainSeatAvailability>
    findByTrainAndTravelDate(Train train, LocalDate travelDate);
}
