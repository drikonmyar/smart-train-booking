package com.booking.service.impl;

import com.booking.dto.CreateTrainRequest;
import com.booking.dto.SearchTrainRequest;
import com.booking.dto.TrainRouteStopRequest;
import com.booking.dto.TrainSearchResponse;
import com.booking.entity.Station;
import com.booking.entity.Train;
import com.booking.entity.TrainRouteStation;
import com.booking.entity.TrainSeatAvailability;
import com.booking.repository.StationRepository;
import com.booking.repository.TrainRepository;
import com.booking.repository.TrainSeatAvailabilityRepository;
import com.booking.service.TrainService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
                        destinationName
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
        train.setRunningDays(request.getRunningDays());

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
}
