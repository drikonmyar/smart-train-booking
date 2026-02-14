package com.booking.repository;

import com.booking.entity.Train;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.util.List;

public interface TrainRepository extends JpaRepository<Train, Long> {
    @Query("SELECT t FROM Train t " +
            "WHERE t.sourceStation.name = :sourceName " +
            "AND t.destinationStation.name = :destinationName " +
            "AND :dayOfWeek MEMBER OF t.runningDays")
    List<Train> findTrainsBySourceDestinationAndDay(
            @Param("sourceName") String sourceName,
            @Param("destinationName") String destinationName,
            @Param("dayOfWeek") DayOfWeek dayOfWeek);
}
