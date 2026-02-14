package com.booking.dto;

import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Data
public class CreateTrainRequest {

    private String trainNumber;
    private String trainName;

    // Preferred for multi-stop trains. Keep order as train route.
    private List<Long> routeStationIds;

    // Backward-compatible fallback for old clients.
    private Long sourceStationId;
    private Long destinationStationId;

    private LocalTime departureTime;
    private LocalTime arrivalTime;

    private Integer totalSeats;

    private Set<DayOfWeek> runningDays;
}
