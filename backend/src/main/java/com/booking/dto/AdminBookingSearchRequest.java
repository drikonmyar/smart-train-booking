package com.booking.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class AdminBookingSearchRequest {

    // Booking date filters
    private LocalDate bookingFromDate;
    private LocalDate bookingToDate;

    // Travel date filters
    private LocalDate travelFromDate;
    private LocalDate travelToDate;

    private String username;
    private String trainNumber;
    private String status; // BOOKED / CANCELLED / TERMINATED

    private String sourceStation;
    private String destinationStation;

    private Integer minSeatsBooked;
    private Integer maxSeatsBooked;
}
