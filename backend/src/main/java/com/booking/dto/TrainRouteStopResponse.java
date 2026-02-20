package com.booking.dto;

import lombok.Data;

import java.time.LocalTime;

@Data
public class TrainRouteStopResponse {
    private Integer stopOrder;
    private Long stationId;
    private String stationCode;
    private String stationName;
    private Integer minutesFromSource;
    private LocalTime scheduledTime;
}
