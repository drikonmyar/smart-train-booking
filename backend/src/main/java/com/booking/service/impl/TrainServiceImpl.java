package com.booking.service.impl;

import com.booking.dto.CreateTrainRequest;
import com.booking.dto.SearchTrainRequest;
import com.booking.dto.TrainAdminDetailsResponse;
import com.booking.dto.TrainAdminRequest;
import com.booking.dto.TrainAdminResponse;
import com.booking.dto.TrainRouteStopRequest;
import com.booking.dto.TrainRouteStopResponse;
import com.booking.dto.TrainSearchResponse;
import com.booking.entity.Booking;
import com.booking.entity.Station;
import com.booking.entity.Train;
import com.booking.entity.TrainRouteStation;
import com.booking.entity.TrainSeatAvailability;
import com.booking.entity.TrainStatus;
import com.booking.repository.BookingRepository;
import com.booking.repository.StationRepository;
import com.booking.repository.TrainRepository;
import com.booking.repository.TrainSeatAvailabilityRepository;
import com.booking.repository.specification.TrainSpecification;
import com.booking.service.TrainService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TrainServiceImpl implements TrainService {

    private final TrainRepository trainRepository;
    private final StationRepository stationRepository;
    private final TrainSeatAvailabilityRepository seatAvailabilityRepository;
    private final BookingRepository bookingRepository;

    @Override
    public Train createTrain(CreateTrainRequest request) {
        Train train = buildTrainFromRequest(request);
        return trainRepository.save(train);
    }

    @Override
    public List<TrainSearchResponse> searchTrains(SearchTrainRequest request) {
        if (request.getTravelDate() == null) {
            throw new RuntimeException("Travel date is required");
        }

        String sourceName = normalizeStationName(
                request.getSourceStationName(),
                "Source station name is required"
        );
        String destinationName = normalizeStationName(
                request.getDestinationStationName(),
                "Destination station name is required"
        );
        if (sourceName.equalsIgnoreCase(destinationName)) {
            throw new RuntimeException("Source and destination must be different");
        }

        List<Train> trains = trainRepository
                .findTrainsByRoute(
                        sourceName,
                        destinationName,
                        TrainStatus.ACTIVE
                );

        return trains.stream()
                .map(train -> mapToResponse(train, request.getTravelDate(), sourceName, destinationName))
                .filter(Objects::nonNull)
                .toList();
    }

    private TrainSearchResponse mapToResponse(
            Train train,
            LocalDate sourceTravelDate,
            String sourceName,
            String destinationName
    ) {
        RouteStopInfo sourceStop = findRouteStopByStationName(train, sourceName)
                .orElseThrow(() -> new RuntimeException(
                        "Source station not found in route for train: " + train.getTrainNumber()
                ));
        RouteStopInfo destinationStop = findRouteStopByStationName(train, destinationName)
                .orElseThrow(() -> new RuntimeException(
                        "Destination station not found in route for train: " + train.getTrainNumber()
                ));

        if (sourceStop.minutesFromSource() >= destinationStop.minutesFromSource()) {
            throw new RuntimeException("Invalid route order for train: " + train.getTrainNumber());
        }

        LocalDate originServiceDate = resolveOriginServiceDate(
                sourceTravelDate,
                train.getDepartureTime(),
                sourceStop.minutesFromSource()
        );
        DayOfWeek originDayOfWeek = originServiceDate.getDayOfWeek();
        if (train.getRunningDays() == null || !train.getRunningDays().contains(originDayOfWeek)) {
            return null;
        }

        TrainSearchResponse response = new TrainSearchResponse();

        response.setTrainId(train.getId());
        response.setTrainNumber(train.getTrainNumber());
        response.setTrainName(train.getTrainName());

        response.setSourceStation(sourceStop.station().getName());
        response.setDestinationStation(destinationStop.station().getName());
        response.setRouteStations(getRouteStationNames(train));

        LocalDateTime baseDepartureDateTime = originServiceDate.atTime(train.getDepartureTime());
        LocalDateTime sourceDepartureDateTime = baseDepartureDateTime.plusMinutes(sourceStop.minutesFromSource());
        LocalDateTime destinationArrivalDateTime = baseDepartureDateTime.plusMinutes(destinationStop.minutesFromSource());

        response.setDepartureDateTime(sourceDepartureDateTime);
        response.setArrivalDateTime(destinationArrivalDateTime);
        response.setDepartureTime(sourceDepartureDateTime.toLocalTime());
        response.setArrivalTime(destinationArrivalDateTime.toLocalTime());

        response.setTotalSeats(train.getTotalSeats());
        response.setRunningDays(train.getRunningDays());

        // Seats Remaining Logic
        Integer seatsRemaining = seatAvailabilityRepository
                .findByTrainAndTravelDate(
                        train,
                        originServiceDate
                )
                .map(TrainSeatAvailability::getAvailableSeats)
                .orElse(train.getTotalSeats());

        response.setSeatsRemaining(seatsRemaining);

        return response;
    }

    @Override
    public List<Long> createMultipleTrains(List<CreateTrainRequest> requests) {

        List<Train> trains = new ArrayList<>();

        for (CreateTrainRequest request : requests) {
            trains.add(buildTrainFromRequest(request));
        }

        List<Train> savedTrains = trainRepository.saveAll(trains);

        // return IDs of created trains
        return savedTrains.stream().map(Train::getId).toList();
    }

    @Override
    public Page<TrainAdminResponse> getAdminTrains(
            String trainNumber,
            String trainName,
            String sourceStation,
            String destinationStation,
            TrainStatus status,
            LocalDate createdFrom,
            LocalDate createdTo,
            Pageable pageable
    ) {
        Specification<Train> spec = TrainSpecification.withFilters(
                trainNumber,
                trainName,
                sourceStation,
                destinationStation,
                status,
                createdFrom,
                createdTo
        );

        return trainRepository.findAll(spec, pageable)
                .map(this::mapToAdminResponse);
    }

    @Override
    public TrainAdminResponse createAdminTrain(TrainAdminRequest request) {
        String trainNumber = normalizeRequired(request.getTrainNumber(), "Train number is required").toUpperCase();
        if (trainRepository.existsByTrainNumber(trainNumber)) {
            throw new RuntimeException("Train number already exists");
        }

        Train train = new Train();
        applyAdminRequestToTrain(train, request);
        train.setTrainNumber(trainNumber);

        Train saved = trainRepository.save(train);
        return mapToAdminResponse(saved);
    }

    @Override
    public TrainAdminResponse updateAdminTrain(Long id, TrainAdminRequest request) {
        Train train = getTrainById(id);

        String trainNumber = normalizeRequired(request.getTrainNumber(), "Train number is required").toUpperCase();
        if (trainRepository.existsByTrainNumberAndIdNot(trainNumber, id)) {
            throw new RuntimeException("Train number already exists");
        }

        train.setTrainNumber(trainNumber);
        applyAdminRequestToTrain(train, request);

        Train saved = trainRepository.save(train);
        return mapToAdminResponse(saved);
    }

    @Override
    public void deleteAdminTrain(Long id, boolean hardDelete) {
        Train train = getTrainById(id);

        if (hardDelete) {
            if (!bookingRepository.findByTrainId(id).isEmpty()) {
                throw new RuntimeException("Cannot hard delete train with existing bookings");
            }
            seatAvailabilityRepository.deleteByTrain(train);
            trainRepository.delete(train);
            return;
        }

        train.setStatus(TrainStatus.INACTIVE);
        trainRepository.save(train);
    }

    @Override
    public TrainAdminResponse toggleTrainStatus(Long id, TrainStatus status) {
        Train train = getTrainById(id);
        TrainStatus nextStatus;

        if (status == null) {
            nextStatus = train.getStatus() == TrainStatus.ACTIVE
                    ? TrainStatus.INACTIVE
                    : TrainStatus.ACTIVE;
        } else {
            nextStatus = status;
        }

        train.setStatus(nextStatus);
        return mapToAdminResponse(trainRepository.save(train));
    }

    @Override
    public TrainAdminDetailsResponse getAdminTrainDetails(Long id) {
        Train train = getTrainById(id);

        TrainAdminDetailsResponse response = new TrainAdminDetailsResponse();
        fillCommonTrainFields(response, train);
        response.setRouteStops(buildRouteStopDetails(train));

        List<Booking> bookings = bookingRepository.findByTrainId(id);
        long activeBookings = bookings.stream()
                .filter(booking -> "BOOKED".equalsIgnoreCase(booking.getStatus()))
                .count();
        long cancelledBookings = bookings.stream()
                .filter(booking -> "CANCELLED".equalsIgnoreCase(booking.getStatus()))
                .count();
        long seatsBooked = bookings.stream()
                .filter(booking -> "BOOKED".equalsIgnoreCase(booking.getStatus()))
                .mapToLong(booking -> booking.getSeatsBooked() == null ? 0 : booking.getSeatsBooked())
                .sum();

        response.setTotalBookings((long) bookings.size());
        response.setActiveBookings(activeBookings);
        response.setCancelledBookings(cancelledBookings);
        response.setSeatsBooked(seatsBooked);

        return response;
    }

    private TrainAdminResponse mapToAdminResponse(Train train) {
        TrainAdminResponse response = new TrainAdminResponse();
        fillCommonTrainFields(response, train);
        return response;
    }

    private void fillCommonTrainFields(TrainAdminResponse response, Train train) {
        JourneySchedule journeySchedule = resolveJourneySchedule(train);

        response.setId(train.getId());
        response.setTrainNumber(train.getTrainNumber());
        response.setTrainName(train.getTrainName());
        response.setSourceStation(train.getSourceStation().getName());
        response.setDestinationStation(train.getDestinationStation().getName());
        response.setTotalSeats(train.getTotalSeats());
        response.setAvailableSeats(resolveAvailableSeats(train));
        response.setStartTime(train.getDepartureTime());
        response.setEndTime(journeySchedule.arrivalTime());
        response.setArrivalDayOffset(journeySchedule.dayOffset());
        response.setRunningDays(resolveRunningDays(train));
        response.setStatus(train.getStatus() == null ? TrainStatus.ACTIVE : train.getStatus());
        response.setCreatedAt(train.getCreatedAt());
        response.setModifiedAt(train.getModifiedAt());
    }

    private List<TrainRouteStopResponse> buildRouteStopDetails(Train train) {
        return getEffectiveRouteStops(train).stream()
                .sorted(Comparator.comparing(RouteStopInfo::stopOrder))
                .map(routeStop -> {
                    TrainRouteStopResponse response = new TrainRouteStopResponse();
                    response.setStopOrder(routeStop.stopOrder());
                    response.setStationId(routeStop.station().getId());
                    response.setStationName(routeStop.station().getName());
                    response.setStationCode(routeStop.station().getCode());
                    response.setMinutesFromSource(routeStop.minutesFromSource());
                    response.setScheduledTime(train.getDepartureTime().plusMinutes(routeStop.minutesFromSource()));
                    return response;
                })
                .toList();
    }

    private Integer resolveAvailableSeats(Train train) {
        return seatAvailabilityRepository.findByTrainAndTravelDate(train, LocalDate.now())
                .map(TrainSeatAvailability::getAvailableSeats)
                .orElse(train.getTotalSeats());
    }

    private List<DayOfWeek> resolveRunningDays(Train train) {
        if (train.getRunningDays() == null || train.getRunningDays().isEmpty()) {
            return List.of();
        }
        return train.getRunningDays().stream()
                .sorted(Comparator.comparingInt(DayOfWeek::getValue))
                .toList();
    }

    private JourneySchedule resolveJourneySchedule(Train train) {
        int maxMinutesFromSource = getEffectiveRouteStops(train).stream()
                .map(RouteStopInfo::minutesFromSource)
                .max(Integer::compareTo)
                .orElse(0);

        int departureMinutes = train.getDepartureTime().toSecondOfDay() / 60;
        int absoluteArrivalMinutes = departureMinutes + maxMinutesFromSource;
        int dayOffset = Math.floorDiv(absoluteArrivalMinutes, 24 * 60);
        LocalTime arrivalTime = train.getDepartureTime().plusMinutes(maxMinutesFromSource);

        return new JourneySchedule(arrivalTime, dayOffset);
    }

    private void applyAdminRequestToTrain(Train train, TrainAdminRequest request) {
        Station sourceStation = getStationById(request.getSourceStationId(), "Source station not found");
        Station destinationStation = getStationById(request.getDestinationStationId(), "Destination station not found");

        if (sourceStation.getId().equals(destinationStation.getId())) {
            throw new RuntimeException("Source and destination cannot be same");
        }
        if (request.getTotalSeats() == null || request.getTotalSeats() <= 0) {
            throw new RuntimeException("Total seats must be greater than zero");
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new RuntimeException("Start and end time are required");
        }

        int minutesFromSource = calculateDurationMinutes(request.getStartTime(), request.getEndTime());

        train.setTrainName(normalizeRequired(request.getTrainName(), "Train name is required"));
        train.setSourceStation(sourceStation);
        train.setDestinationStation(destinationStation);
        train.setDepartureTime(request.getStartTime());
        train.setTotalSeats(request.getTotalSeats());
        train.setStatus(request.getStatus() == null ? TrainStatus.ACTIVE : request.getStatus());
        if (train.getRunningDays() == null || train.getRunningDays().isEmpty()) {
            train.setRunningDays(EnumSet.allOf(DayOfWeek.class));
        }

        List<TrainRouteStation> routeStations = new ArrayList<>();
        routeStations.add(buildRouteStop(train, sourceStation, 0, 0));
        routeStations.add(buildRouteStop(train, destinationStation, 1, minutesFromSource));
        train.setRouteStations(routeStations);
    }

    private TrainRouteStation buildRouteStop(
            Train train,
            Station station,
            int stopOrder,
            int minutesFromSource
    ) {
        TrainRouteStation routeStation = new TrainRouteStation();
        routeStation.setTrain(train);
        routeStation.setStation(station);
        routeStation.setStopOrder(stopOrder);
        routeStation.setMinutesFromSource(minutesFromSource);
        return routeStation;
    }

    private Station getStationById(Long stationId, String notFoundMessage) {
        if (stationId == null) {
            throw new RuntimeException(notFoundMessage);
        }
        return stationRepository.findById(stationId)
                .orElseThrow(() -> new RuntimeException(notFoundMessage));
    }

    private Train getTrainById(Long id) {
        return trainRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Train not found with id: " + id));
    }

    private int calculateDurationMinutes(LocalTime startTime, LocalTime endTime) {
        if (startTime.equals(endTime)) {
            throw new RuntimeException("Start and end time cannot be same");
        }

        long diff = ChronoUnit.MINUTES.between(startTime, endTime);
        if (diff < 0) {
            diff += 24 * 60;
        }

        if (diff <= 0 || diff >= 24 * 60) {
            throw new RuntimeException("Invalid train journey duration");
        }
        return (int) diff;
    }

    private Train buildTrainFromRequest(CreateTrainRequest request) {
        if (request.getDepartureTime() == null) {
            throw new RuntimeException("Departure time is required");
        }
        if (request.getTotalSeats() == null || request.getTotalSeats() <= 0) {
            throw new RuntimeException("Total seats must be greater than zero");
        }

        List<RouteStopInput> routeStops = resolveRouteStops(request);

        Train train = new Train();
        train.setTrainNumber(request.getTrainNumber());
        train.setTrainName(request.getTrainName());
        train.setSourceStation(routeStops.getFirst().station());
        train.setDestinationStation(routeStops.getLast().station());
        train.setDepartureTime(request.getDepartureTime());
        train.setTotalSeats(request.getTotalSeats());
        if (request.getRunningDays() == null || request.getRunningDays().isEmpty()) {
            train.setRunningDays(EnumSet.allOf(DayOfWeek.class));
        } else {
            train.setRunningDays(request.getRunningDays());
        }
        train.setStatus(TrainStatus.ACTIVE);

        List<TrainRouteStation> routeStations = new ArrayList<>();
        for (int index = 0; index < routeStops.size(); index++) {
            RouteStopInput routeStop = routeStops.get(index);

            TrainRouteStation routeStation = new TrainRouteStation();
            routeStation.setTrain(train);
            routeStation.setStation(routeStop.station());
            routeStation.setStopOrder(index);
            routeStation.setMinutesFromSource(routeStop.minutesFromSource());
            routeStations.add(routeStation);
        }
        train.setRouteStations(routeStations);

        return train;
    }

    private List<RouteStopInput> resolveRouteStops(CreateTrainRequest request) {
        List<TrainRouteStopRequest> routeStops = request.getRouteStops();
        if (routeStops == null || routeStops.size() < 2) {
            throw new RuntimeException("Train route must contain at least two stations");
        }

        Set<Long> uniqueStationIds = new HashSet<>();
        List<RouteStopInput> resolvedRouteStops = new ArrayList<>();
        int previousMinutesFromSource = -1;

        for (int index = 0; index < routeStops.size(); index++) {
            TrainRouteStopRequest routeStop = routeStops.get(index);
            if (routeStop.getStationId() == null) {
                throw new RuntimeException("Route station id cannot be null");
            }
            if (routeStop.getMinutesFromSource() == null || routeStop.getMinutesFromSource() < 0) {
                throw new RuntimeException("minutesFromSource must be zero or positive");
            }
            if (index == 0 && routeStop.getMinutesFromSource() != 0) {
                throw new RuntimeException("First route station must have minutesFromSource = 0");
            }
            if (routeStop.getMinutesFromSource() <= previousMinutesFromSource) {
                throw new RuntimeException("Route station minutes must be strictly increasing");
            }
            if (!uniqueStationIds.add(routeStop.getStationId())) {
                throw new RuntimeException("Duplicate stations are not allowed in train route");
            }

            Station station = stationRepository.findById(routeStop.getStationId())
                    .orElseThrow(() -> new RuntimeException(
                            "Station not found for id: " + routeStop.getStationId()
                    ));
            resolvedRouteStops.add(new RouteStopInput(station, routeStop.getMinutesFromSource()));
            previousMinutesFromSource = routeStop.getMinutesFromSource();
        }

        return resolvedRouteStops;
    }

    private String normalizeStationName(String value, String errorMessage) {
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException(errorMessage);
        }
        return value.trim();
    }

    private String normalizeRequired(String value, String errorMessage) {
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException(errorMessage);
        }
        return value.trim();
    }

    private Optional<RouteStopInfo> findRouteStopByStationName(Train train, String stationName) {
        return getEffectiveRouteStops(train).stream()
                .filter(routeStop -> routeStop.station().getName().equalsIgnoreCase(stationName))
                .findFirst();
    }

    private List<RouteStopInfo> getEffectiveRouteStops(Train train) {
        if (train.getRouteStations() != null && !train.getRouteStations().isEmpty()) {
            return train.getRouteStations().stream()
                    .map(routeStation -> new RouteStopInfo(
                            routeStation.getStation(),
                            routeStation.getStopOrder(),
                            routeStation.getMinutesFromSource() != null
                                    ? routeStation.getMinutesFromSource()
                                    : routeStation.getStopOrder() * 60
                    ))
                    .toList();
        }

        return List.of(
                new RouteStopInfo(train.getSourceStation(), 0, 0),
                new RouteStopInfo(train.getDestinationStation(), 1, 60)
        );
    }

    private List<String> getRouteStationNames(Train train) {
        return getEffectiveRouteStops(train).stream()
                .map(routeStop -> routeStop.station().getName())
                .toList();
    }

    private LocalDate resolveOriginServiceDate(
            LocalDate sourceTravelDate,
            java.time.LocalTime originDepartureTime,
            Integer sourceMinutesFromSource
    ) {
        int departureMinutes = originDepartureTime.toSecondOfDay() / 60;
        int sourceAbsoluteMinutes = departureMinutes + sourceMinutesFromSource;
        int sourceDayShift = Math.floorDiv(sourceAbsoluteMinutes, 24 * 60);
        return sourceTravelDate.minusDays(sourceDayShift);
    }

    private record RouteStopInput(Station station, Integer minutesFromSource) {
    }

    private record RouteStopInfo(Station station, Integer stopOrder, Integer minutesFromSource) {
    }

    private record JourneySchedule(LocalTime arrivalTime, Integer dayOffset) {
    }
}
