package com.booking.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateBookingRequest {

    private Long userId;
    private Long trainId;
    private String sourceStationName;
    private String destinationStationName;
    private LocalDate travelDate;
    private Integer seatsBooked;
}
