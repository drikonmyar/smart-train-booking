package com.booking.repository;

import com.booking.entity.Train;
import com.booking.entity.TrainStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TrainRepository extends JpaRepository<Train, Long>, JpaSpecificationExecutor<Train> {
    @Query("""
            SELECT DISTINCT t FROM Train t
            LEFT JOIN t.routeStations sourceStop
            LEFT JOIN sourceStop.station sourceStation
            LEFT JOIN t.routeStations destinationStop
            LEFT JOIN destinationStop.station destinationStation
            WHERE (
                  (
                      LOWER(sourceStation.name) = LOWER(:sourceName)
                      AND LOWER(destinationStation.name) = LOWER(:destinationName)
                      AND COALESCE(sourceStop.minutesFromSource, sourceStop.stopOrder * 60)
                          < COALESCE(destinationStop.minutesFromSource, destinationStop.stopOrder * 60)
                  )
                  OR (
                      LOWER(t.sourceStation.name) = LOWER(:sourceName)
                      AND LOWER(t.destinationStation.name) = LOWER(:destinationName)
                  )
              )
              AND t.status = :activeStatus
            """)
    List<Train> findTrainsByRoute(
            @Param("sourceName") String sourceName,
            @Param("destinationName") String destinationName,
            @Param("activeStatus") TrainStatus activeStatus);

    boolean existsByTrainNumber(String trainNumber);

    boolean existsByTrainNumberAndIdNot(String trainNumber, Long id);
}
