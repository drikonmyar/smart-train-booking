package com.booking.service;

import com.booking.dto.CreateBookingRequest;
import com.booking.dto.BookingResponse;

public interface BookingService {

    BookingResponse createBooking(CreateBookingRequest request);
}
