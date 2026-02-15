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

    // Departure from train source station.
    private LocalTime departureTime;

    // Ordered route with cumulative travel minutes from source station.
    private List<TrainRouteStopRequest> routeStops;

    private Integer totalSeats;

    private Set<DayOfWeek> runningDays;
}
