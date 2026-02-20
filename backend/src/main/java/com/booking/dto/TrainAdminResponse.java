package com.booking.dto;

import com.booking.entity.TrainStatus;
import lombok.Data;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
public class TrainAdminResponse {
    private Long id;
    private String trainNumber;
    private String trainName;
    private String sourceStation;
    private String destinationStation;
    private Integer totalSeats;
    private Integer availableSeats;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer arrivalDayOffset;
    private List<DayOfWeek> runningDays;
    private TrainStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;
}
