package com.booking.repository;

import com.booking.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StationRepository extends JpaRepository<Station, Long> {
    List<Station> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(
            String name,
            String code
    );
}
