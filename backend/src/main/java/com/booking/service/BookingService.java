package com.booking.service;

import com.booking.dto.*;

import java.util.List;

public interface BookingService {

    BookingResponse createBooking(CreateBookingRequest request);
    List<BookingHistoryResponse> getBookingHistory(Long userId);
    void cancelBooking(Long bookingId);
    List<AdminBookingResponse> searchBookings(AdminBookingSearchRequest request);
}
