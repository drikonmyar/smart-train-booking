package com.booking.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

import lombok.Data;

@Data
public class TrainSearchResponse {

    private Long trainId;
    private String trainNumber;
    private String trainName;

    private String sourceStation;
    private String destinationStation;

    private LocalTime departureTime;
    private LocalTime arrivalTime;

    private Integer totalSeats;
    private Integer seatsRemaining;

    private Set<DayOfWeek> runningDays;
}
