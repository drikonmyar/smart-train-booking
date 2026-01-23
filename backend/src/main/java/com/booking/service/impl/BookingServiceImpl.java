package com.booking.service.impl;

import com.booking.dto.BookingHistoryResponse;
import com.booking.dto.BookingResponse;
import com.booking.dto.CreateBookingRequest;
import com.booking.entity.Booking;
import com.booking.entity.Train;
import com.booking.entity.TrainSeatAvailability;
import com.booking.entity.User;
import com.booking.repository.BookingRepository;
import com.booking.repository.TrainRepository;
import com.booking.repository.TrainSeatAvailabilityRepository;
import com.booking.repository.UserRepository;
import com.booking.service.BookingService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TrainRepository trainRepository;
    private final TrainSeatAvailabilityRepository availabilityRepository;

    @Transactional
    @Override
    public BookingResponse createBooking(CreateBookingRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Train train = trainRepository.findById(request.getTrainId())
                .orElseThrow(() -> new RuntimeException("Train not found"));

        DayOfWeek travelDay = request.getTravelDate().getDayOfWeek();
        if (!train.getRunningDays().contains(travelDay)) {
            throw new RuntimeException("Train does not run on selected date");
        }

        TrainSeatAvailability availability =
                availabilityRepository.findByTrainAndTravelDate(train, request.getTravelDate())
                        .orElseGet(() -> {
                            TrainSeatAvailability a = new TrainSeatAvailability();
                            a.setTrain(train);
                            a.setTravelDate(request.getTravelDate());
                            a.setAvailableSeats(train.getTotalSeats());
                            return availabilityRepository.save(a);
                        });

        if (availability.getAvailableSeats() < request.getSeatsBooked()) {
            throw new RuntimeException("Not enough seats available");
        }

        availability.setAvailableSeats(
                availability.getAvailableSeats() - request.getSeatsBooked()
        );

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTrain(train);
        booking.setTravelDate(request.getTravelDate());
        booking.setSeatsBooked(request.getSeatsBooked());
        booking.setStatus("BOOKED");

        bookingRepository.save(booking);
        availabilityRepository.save(availability);

        return mapToResponse(booking);
    }

    private BookingResponse mapToResponse(Booking booking) {

        BookingResponse response = new BookingResponse();
        response.setBookingId(booking.getId());
        response.setUserId(booking.getUser().getId());
        response.setTrainId(booking.getTrain().getId());
        response.setTravelDate(booking.getTravelDate());
        response.setSeatsBooked(booking.getSeatsBooked());
        response.setStatus(booking.getStatus());

        return response;
    }

    @Override
    public List<BookingHistoryResponse> getBookingHistory(Long userId) {

        List<Booking> bookings =
                bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return bookings.stream()
                .map(this::mapToBookingHistoryResponse)
                .collect(Collectors.toList());
    }

    private BookingHistoryResponse mapToBookingHistoryResponse(Booking booking) {

        BookingHistoryResponse response = new BookingHistoryResponse();

        response.setBookingId(booking.getId());
        response.setTravelDate(booking.getTravelDate());
        response.setSeatsBooked(booking.getSeatsBooked());
        response.setStatus(booking.getStatus());
        response.setCreatedAt(booking.getCreatedAt());

        response.setTrainNumber(booking.getTrain().getTrainNumber());
        response.setTrainName(booking.getTrain().getTrainName());

        response.setSourceStation(
                booking.getTrain().getSourceStation().getName()
        );
        response.setDestinationStation(
                booking.getTrain().getDestinationStation().getName()
        );

        return response;
    }

    @Transactional
    @Override
    public void cancelBooking(Long bookingId) {

        Booking booking = bookingRepository
                .findByIdAndStatus(bookingId, "BOOKED")
                .orElseThrow(() ->
                        new RuntimeException("Booking not found or already cancelled")
                );

        booking.setStatus("CANCELLED");

        TrainSeatAvailability availability =
                availabilityRepository
                        .findByTrainAndTravelDate(
                                booking.getTrain(),
                                booking.getTravelDate()
                        )
                        .orElseThrow(() ->
                                new RuntimeException("Seat availability not found")
                        );

        availability.setAvailableSeats(
                availability.getAvailableSeats() + booking.getSeatsBooked()
        );

        bookingRepository.save(booking);
        availabilityRepository.save(availability);
    }
}
