package com.booking.controller;

import com.booking.dto.*;
import com.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/create")
    public ResponseEntity<BookingResponse> createBooking(
            @RequestBody CreateBookingRequest request
    ) {
        BookingResponse response = bookingService.createBooking(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingHistoryResponse>> getUserBookings(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                bookingService.getBookingHistory(userId)
        );
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<String> cancelBooking(
            @PathVariable Long bookingId) {

        bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok("Booking cancelled successfully");
    }

    @PostMapping("/getall")
    public List<AdminBookingResponse> searchBookings(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestBody AdminBookingSearchRequest request) {
        requireAdmin(userRole);

        return bookingService.searchBookings(request);
    }

    private void requireAdmin(String userRole) {
        if (userRole == null || !userRole.equalsIgnoreCase("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ADMIN can access this resource");
        }
    }
}
