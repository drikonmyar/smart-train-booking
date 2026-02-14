package com.booking.service.impl;

import com.booking.dto.CreateTrainRequest;
import com.booking.dto.SearchTrainRequest;
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
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
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

        DayOfWeek dayOfWeek = request.getTravelDate().getDayOfWeek();

        List<Train> trains = trainRepository
                .findTrainsByRouteAndDay(
                        sourceName,
                        destinationName,
                        dayOfWeek
                );

        return trains.stream()
                .map(train -> mapToResponse(train, request, sourceName, destinationName))
                .toList();
    }

    private TrainSearchResponse mapToResponse(
            Train train,
            SearchTrainRequest request,
            String sourceName,
            String destinationName
    ) {

        TrainSearchResponse response = new TrainSearchResponse();

        response.setTrainId(train.getId());
        response.setTrainNumber(train.getTrainNumber());
        response.setTrainName(train.getTrainName());

        response.setSourceStation(
                findStationNameInRoute(train, sourceName)
                        .orElse(sourceName)
        );
        response.setDestinationStation(
                findStationNameInRoute(train, destinationName)
                        .orElse(destinationName)
        );
        response.setRouteStations(getRouteStationNames(train));

        response.setDepartureTime(train.getDepartureTime());
        response.setArrivalTime(train.getArrivalTime());

        response.setTotalSeats(train.getTotalSeats());
        response.setRunningDays(train.getRunningDays());

        // Seats Remaining Logic
        Integer seatsRemaining = seatAvailabilityRepository
                .findByTrainAndTravelDate(
                        train,
                        request.getTravelDate()
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
        List<Station> route = resolveRouteStations(request);

        Train train = new Train();
        train.setTrainNumber(request.getTrainNumber());
        train.setTrainName(request.getTrainName());
        train.setSourceStation(route.getFirst());
        train.setDestinationStation(route.getLast());
        train.setDepartureTime(request.getDepartureTime());
        train.setArrivalTime(request.getArrivalTime());
        train.setTotalSeats(request.getTotalSeats());
        train.setRunningDays(request.getRunningDays());

        List<TrainRouteStation> routeStations = new ArrayList<>();
        for (int index = 0; index < route.size(); index++) {
            TrainRouteStation routeStation = new TrainRouteStation();
            routeStation.setTrain(train);
            routeStation.setStation(route.get(index));
            routeStation.setStopOrder(index);
            routeStations.add(routeStation);
        }
        train.setRouteStations(routeStations);

        return train;
    }

    private List<Station> resolveRouteStations(CreateTrainRequest request) {
        List<Long> routeStationIds = request.getRouteStationIds();
        if (routeStationIds != null && !routeStationIds.isEmpty()) {
            if (routeStationIds.size() < 2) {
                throw new RuntimeException("Train route must contain at least two stations");
            }
            return fetchStationsByIds(routeStationIds);
        }

        if (request.getSourceStationId() != null && request.getDestinationStationId() != null) {
            return fetchStationsByIds(List.of(request.getSourceStationId(), request.getDestinationStationId()));
        }

        throw new RuntimeException("Provide routeStationIds or sourceStationId and destinationStationId");
    }

    private List<Station> fetchStationsByIds(List<Long> stationIds) {
        Set<Long> dedupe = new HashSet<>(stationIds);
        if (dedupe.size() != stationIds.size()) {
            throw new RuntimeException("Duplicate stations are not allowed in train route");
        }

        List<Station> routeStations = new ArrayList<>();
        for (Long stationId : stationIds) {
            if (stationId == null) {
                throw new RuntimeException("Route station id cannot be null");
            }

            Station station = stationRepository.findById(stationId)
                    .orElseThrow(() -> new RuntimeException("Station not found for id: " + stationId));
            routeStations.add(station);
        }
        return routeStations;
    }

    private String normalizeStationName(String value, String errorMessage) {
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException(errorMessage);
        }
        return value.trim();
    }

    private Optional<String> findStationNameInRoute(Train train, String searchName) {
        if (train.getRouteStations() == null || train.getRouteStations().isEmpty()) {
            return Optional.empty();
        }

        return train.getRouteStations().stream()
                .map(routeStation -> routeStation.getStation().getName())
                .filter(name -> name.equalsIgnoreCase(searchName))
                .findFirst();
    }

    private List<String> getRouteStationNames(Train train) {
        if (train.getRouteStations() != null && !train.getRouteStations().isEmpty()) {
            return train.getRouteStations().stream()
                    .map(routeStation -> routeStation.getStation().getName())
                    .toList();
        }

        return List.of(
                train.getSourceStation().getName(),
                train.getDestinationStation().getName()
        );
    }
}
