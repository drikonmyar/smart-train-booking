package com.booking.dto;

import com.booking.entity.Station;
import com.booking.entity.Train;
import com.booking.entity.User;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class AdminBookingResponse {

    private Long bookingId;

    private User user;

    private Train train;

    private Station sourceStation;
    private Station destinationStation;

    private LocalDate travelDate;
    private Integer seatsBooked;
    private String status;

    private LocalDateTime bookingDate;
}
