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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final int MAX_BOOKED_SEATS_PER_USER_PER_TRAIN_PER_DAY = 9;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TrainRepository trainRepository;
    private final TrainSeatAvailabilityRepository availabilityRepository;

    @Transactional
    @Override
    public BookingResponse createBooking(CreateBookingRequest request) {
        Integer requestedSeats = request.getSeatsBooked();
        if (requestedSeats == null || requestedSeats <= 0) {
            throw new RuntimeException("Seats booked must be at least 1");
        }
        if (request.getTravelDate() == null) {
            throw new RuntimeException("Travel date is required");
        }
        if (requestedSeats > MAX_BOOKED_SEATS_PER_USER_PER_TRAIN_PER_DAY) {
            throw new RuntimeException("Maximum seats per booking is 9");
        }

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Train train = trainRepository.findById(request.getTrainId())
                .orElseThrow(() -> new RuntimeException("Train not found"));

        boolean hasActiveBookingForSameDay = bookingRepository
                .existsByUserIdAndTrainIdAndTravelDateAndStatusIgnoreCase(
                        user.getId(),
                        train.getId(),
                        request.getTravelDate(),
                        "BOOKED"
                );

        if (hasActiveBookingForSameDay) {
            throw new RuntimeException(
                    "You already have an active booking for this train on "
                            + request.getTravelDate()
                            + ". Please terminate/cancel it before booking again."
            );
        }

        int alreadyBookedSeats = Optional.ofNullable(
                bookingRepository.findBookedSeatsForUserAndTrainAndDate(
                        user.getId(),
                        train.getId(),
                        request.getTravelDate()
                )
        ).orElse(0);
        if (alreadyBookedSeats >= MAX_BOOKED_SEATS_PER_USER_PER_TRAIN_PER_DAY) {
            throw new RuntimeException("Booking limit reached. A user can book at most 9 seats per train per day.");
        }

        int remainingSeatsAllowed = MAX_BOOKED_SEATS_PER_USER_PER_TRAIN_PER_DAY - alreadyBookedSeats;
        if (requestedSeats > remainingSeatsAllowed) {
            throw new RuntimeException(
                    "Booking limit exceeded. You can book only "
                            + remainingSeatsAllowed
                            + " more seat(s) for this train on "
                            + request.getTravelDate()
                            + "."
            );
        }

        RouteSelection routeSelection = resolveRouteSelection(train, request);
        LocalDate originServiceDate = resolveOriginServiceDate(
                request.getTravelDate(),
                train,
                routeSelection.sourceStation()
        );

        DayOfWeek originDay = originServiceDate.getDayOfWeek();
        if (train.getRunningDays() == null || !train.getRunningDays().contains(originDay)) {
            throw new RuntimeException("Train does not run on selected date");
        }

        TrainSeatAvailability availability =
                availabilityRepository.findByTrainAndTravelDate(train, originServiceDate)
                        .orElseGet(() -> {
                            TrainSeatAvailability a = new TrainSeatAvailability();
                            a.setTrain(train);
                            a.setTravelDate(originServiceDate);
                            a.setAvailableSeats(train.getTotalSeats());
                            return availabilityRepository.save(a);
                        });

        if (availability.getAvailableSeats() < requestedSeats) {
            throw new RuntimeException("Not enough seats available");
        }

        availability.setAvailableSeats(
                availability.getAvailableSeats() - requestedSeats
        );

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTrain(train);
        booking.setSourceStation(routeSelection.sourceStation());
        booking.setDestinationStation(routeSelection.destinationStation());
        booking.setTravelDate(request.getTravelDate());
        booking.setSeatsBooked(requestedSeats);
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
                                resolveOriginServiceDate(
                                        booking.getTravelDate(),
                                        booking.getTrain(),
                                        getEffectiveSourceStation(booking)
                                )
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

        int sourceMinutes = getStationMinutesFromSource(train, sourceStation);
        int destinationMinutes = getStationMinutesFromSource(train, destinationStation);

        if (sourceMinutes == -1 || destinationMinutes == -1) {
            throw new RuntimeException("Unable to validate booking route for selected train");
        }
        if (sourceMinutes >= destinationMinutes) {
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

    private int getStationMinutesFromSource(Train train, Station station) {
        if (station == null) {
            return -1;
        }

        if (train.getRouteStations() != null && !train.getRouteStations().isEmpty()) {
            return train.getRouteStations().stream()
                    .filter(routeStation -> routeStation.getStation().getId().equals(station.getId()))
                    .map(routeStation -> routeStation.getMinutesFromSource() != null
                            ? routeStation.getMinutesFromSource()
                            : routeStation.getStopOrder() * 60)
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

    private LocalDate resolveOriginServiceDate(
            LocalDate sourceTravelDate,
            Train train,
            Station sourceStation
    ) {
        int sourceMinutesFromSource = getStationMinutesFromSource(train, sourceStation);
        if (sourceMinutesFromSource < 0) {
            throw new RuntimeException("Unable to resolve source station timing for booking");
        }

        int departureMinutes = train.getDepartureTime().toSecondOfDay() / 60;
        int sourceAbsoluteMinutes = departureMinutes + sourceMinutesFromSource;
        int sourceDayShift = Math.floorDiv(sourceAbsoluteMinutes, 24 * 60);
        return sourceTravelDate.minusDays(sourceDayShift);
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
