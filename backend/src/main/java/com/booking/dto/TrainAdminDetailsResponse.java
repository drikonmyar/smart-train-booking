package com.booking.dto;

import lombok.Data;

import java.util.List;

@Data
public class TrainAdminDetailsResponse extends TrainAdminResponse {
    private List<TrainRouteStopResponse> routeStops;
    private Long totalBookings;
    private Long activeBookings;
    private Long cancelledBookings;
    private Long seatsBooked;
}
