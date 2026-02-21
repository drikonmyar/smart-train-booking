package com.booking.dto;

import com.booking.entity.TrainStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

@Data
public class TrainAdminRequest {

    @NotBlank
    private String trainNumber;

    @NotBlank
    private String trainName;

    @NotNull
    private Long sourceStationId;

    @NotNull
    private Long destinationStationId;

    @NotNull
    @Positive
    private Integer totalSeats;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @Positive
    private Integer journeyDurationMinutes;

    private Set<DayOfWeek> runningDays;

    private TrainStatus status;
}
