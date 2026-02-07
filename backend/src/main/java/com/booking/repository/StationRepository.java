package com.booking.repository;

import com.booking.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StationRepository extends JpaRepository<Station, Long> {
    List<Station> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(
            String name,
            String code
    );

    @Query("""
SELECT s FROM Station s
WHERE
    (
        :q IS NULL
        OR s.name ILIKE CONCAT('%', :q, '%')
        OR s.code ILIKE CONCAT('%', :q, '%')
    )
    AND s.createdAt >= COALESCE(:createdFrom, s.createdAt)
    AND s.createdAt <= COALESCE(:createdTo, s.createdAt)
    AND s.modifiedAt >= COALESCE(:modifiedFrom, s.modifiedAt)
    AND s.modifiedAt <= COALESCE(:modifiedTo, s.modifiedAt)
""")
    List<Station> searchStations(
            @Param("q") String q,
            @Param("createdFrom") LocalDateTime createdFrom,
            @Param("createdTo") LocalDateTime createdTo,
            @Param("modifiedFrom") LocalDateTime modifiedFrom,
            @Param("modifiedTo") LocalDateTime modifiedTo
    );
}
