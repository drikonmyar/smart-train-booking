package com.booking.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class SearchTrainRequest {
    private String sourceStationName;
    private String destinationStationName;
    private LocalDate travelDate;
}
