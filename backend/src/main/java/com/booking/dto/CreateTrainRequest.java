package com.booking.dto;

import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

@Data
public class CreateTrainRequest {

    private String trainNumber;
    private String trainName;

    private Long sourceStationId;
    private Long destinationStationId;

    private LocalTime departureTime;
    private LocalTime arrivalTime;

    private Integer totalSeats;

    private Set<DayOfWeek> runningDays;
}
