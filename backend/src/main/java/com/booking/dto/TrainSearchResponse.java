package com.booking.dto;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import lombok.Data;

@Data
public class TrainSearchResponse {

    private Long trainId;
    private String trainNumber;
    private String trainName;

    private String sourceStation;
    private String destinationStation;
    private List<String> routeStations;

    private LocalDateTime departureDateTime;
    private LocalDateTime arrivalDateTime;

    private LocalTime departureTime;
    private LocalTime arrivalTime;

    private Integer totalSeats;
    private Integer seatsRemaining;

    private Set<DayOfWeek> runningDays;
}
