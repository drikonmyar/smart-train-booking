package com.booking.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingResponse {

    private Long bookingId;
    private Long userId;
    private Long trainId;
    private LocalDate travelDate;
    private Integer seatsBooked;
    private String status;
}
