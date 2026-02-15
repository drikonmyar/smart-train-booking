package com.booking.dto;

import lombok.Data;

@Data
public class TrainRouteStopRequest {
    private Long stationId;
    private Integer minutesFromSource;
}
