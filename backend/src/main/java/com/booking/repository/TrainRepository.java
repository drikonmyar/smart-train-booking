package com.booking.repository;

import com.booking.entity.Train;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.util.List;

public interface TrainRepository extends JpaRepository<Train, Long> {
    @Query("""
            SELECT DISTINCT t FROM Train t
            LEFT JOIN t.routeStations sourceStop
            LEFT JOIN sourceStop.station sourceStation
            LEFT JOIN t.routeStations destinationStop
            LEFT JOIN destinationStop.station destinationStation
            WHERE :dayOfWeek MEMBER OF t.runningDays
              AND (
                  (
                      LOWER(sourceStation.name) = LOWER(:sourceName)
                      AND LOWER(destinationStation.name) = LOWER(:destinationName)
                      AND sourceStop.stopOrder < destinationStop.stopOrder
                  )
                  OR (
                      LOWER(t.sourceStation.name) = LOWER(:sourceName)
                      AND LOWER(t.destinationStation.name) = LOWER(:destinationName)
                  )
              )
            """)
    List<Train> findTrainsByRouteAndDay(
            @Param("sourceName") String sourceName,
            @Param("destinationName") String destinationName,
            @Param("dayOfWeek") DayOfWeek dayOfWeek);
}
