package com.booking.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class BookingHistoryResponse {

    private Long bookingId;

    private String trainNumber;
    private String trainName;

    private String sourceStation;
    private String destinationStation;

    private LocalDate travelDate;
    private Integer seatsBooked;
    private String status;

    private LocalDateTime createdAt;
}
