package com.booking.service.impl;

import com.booking.dto.*;
import com.booking.entity.Booking;
import com.booking.entity.Station;
import com.booking.entity.Train;
import com.booking.entity.TrainRouteStation;
import com.booking.entity.TrainSeatAvailability;
import com.booking.entity.User;
import com.booking.repository.BookingRepository;
import com.booking.repository.TrainRepository;
import com.booking.repository.TrainSeatAvailabilityRepository;
import com.booking.repository.UserRepository;
import com.booking.repository.specification.BookingSpecification;
import com.booking.service.BookingService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;
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

        RouteSelection routeSelection = resolveRouteSelection(train, request);

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
        booking.setSourceStation(routeSelection.sourceStation());
        booking.setDestinationStation(routeSelection.destinationStation());
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

        response.setSourceStation(getEffectiveSourceStation(booking).getName());
        response.setDestinationStation(getEffectiveDestinationStation(booking).getName());

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

    @Override
    public List<AdminBookingResponse> searchBookings(AdminBookingSearchRequest request) {
        Specification<Booking> spec = BookingSpecification.withFilters(request);

        return bookingRepository.findAll(spec)
                .stream()
                .map(this::mapToAdminBookingResponse)
                .toList();
    }

    private AdminBookingResponse mapToAdminBookingResponse(Booking booking) {
        AdminBookingResponse res = new AdminBookingResponse();

        res.setBookingId(booking.getId());

        res.setUser(booking.getUser());
        res.setTrain(booking.getTrain());

        res.setSourceStation(getEffectiveSourceStation(booking));
        res.setDestinationStation(getEffectiveDestinationStation(booking));

        res.setTravelDate(booking.getTravelDate());
        res.setSeatsBooked(booking.getSeatsBooked());
        res.setStatus(booking.getStatus());

        res.setBookingDate(booking.getCreatedAt());

        return res;
    }

    private RouteSelection resolveRouteSelection(Train train, CreateBookingRequest request) {
        String sourceName = normalizeOptional(request.getSourceStationName());
        String destinationName = normalizeOptional(request.getDestinationStationName());

        if ((sourceName == null) != (destinationName == null)) {
            throw new RuntimeException("Provide both source and destination station names for booking");
        }

        Station sourceStation = sourceName == null
                ? train.getSourceStation()
                : findStationInRoute(train, sourceName)
                .orElseThrow(() -> new RuntimeException("Source station is not part of selected train route"));

        Station destinationStation = destinationName == null
                ? train.getDestinationStation()
                : findStationInRoute(train, destinationName)
                .orElseThrow(() -> new RuntimeException("Destination station is not part of selected train route"));

        int sourceOrder = getStationOrder(train, sourceStation);
        int destinationOrder = getStationOrder(train, destinationStation);

        if (sourceOrder == -1 || destinationOrder == -1) {
            throw new RuntimeException("Unable to validate booking route for selected train");
        }
        if (sourceOrder >= destinationOrder) {
            throw new RuntimeException("Source station must come before destination station in train route");
        }

        return new RouteSelection(sourceStation, destinationStation);
    }

    private Optional<Station> findStationInRoute(Train train, String stationName) {
        if (train.getRouteStations() == null || train.getRouteStations().isEmpty()) {
            return Optional.ofNullable(resolveLegacyStationByName(train, stationName));
        }

        return train.getRouteStations().stream()
                .map(TrainRouteStation::getStation)
                .filter(station -> station.getName().equalsIgnoreCase(stationName))
                .findFirst();
    }

    private int getStationOrder(Train train, Station station) {
        if (station == null) {
            return -1;
        }

        if (train.getRouteStations() != null && !train.getRouteStations().isEmpty()) {
            return train.getRouteStations().stream()
                    .filter(routeStation -> routeStation.getStation().getId().equals(station.getId()))
                    .map(TrainRouteStation::getStopOrder)
                    .findFirst()
                    .orElse(-1);
        }

        if (train.getSourceStation() != null && train.getSourceStation().getId().equals(station.getId())) {
            return 0;
        }
        if (train.getDestinationStation() != null && train.getDestinationStation().getId().equals(station.getId())) {
            return 1;
        }
        return -1;
    }

    private Station resolveLegacyStationByName(Train train, String stationName) {
        if (train.getSourceStation().getName().equalsIgnoreCase(stationName)) {
            return train.getSourceStation();
        }
        if (train.getDestinationStation().getName().equalsIgnoreCase(stationName)) {
            return train.getDestinationStation();
        }
        return null;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Station getEffectiveSourceStation(Booking booking) {
        return booking.getSourceStation() != null
                ? booking.getSourceStation()
                : booking.getTrain().getSourceStation();
    }

    private Station getEffectiveDestinationStation(Booking booking) {
        return booking.getDestinationStation() != null
                ? booking.getDestinationStation()
                : booking.getTrain().getDestinationStation();
    }

    private record RouteSelection(Station sourceStation, Station destinationStation) {
    }
}
