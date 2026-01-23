package com.booking.service;

import com.booking.dto.BookingHistoryResponse;
import com.booking.dto.CreateBookingRequest;
import com.booking.dto.BookingResponse;

import java.util.List;

public interface BookingService {

    BookingResponse createBooking(CreateBookingRequest request);
    List<BookingHistoryResponse> getBookingHistory(Long userId);
    void cancelBooking(Long bookingId);
}
