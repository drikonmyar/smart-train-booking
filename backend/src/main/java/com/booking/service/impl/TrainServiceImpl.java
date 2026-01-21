package com.booking.service.impl;

import com.booking.dto.CreateTrainRequest;
import com.booking.dto.SearchTrainRequest;
import com.booking.dto.TrainSearchResponse;
import com.booking.entity.Station;
import com.booking.entity.Train;
import com.booking.entity.TrainSeatAvailability;
import com.booking.repository.StationRepository;
import com.booking.repository.TrainRepository;
import com.booking.repository.TrainSeatAvailabilityRepository;
import com.booking.service.TrainService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainServiceImpl implements TrainService {

    private final TrainRepository trainRepository;
    private final StationRepository stationRepository;
    private final TrainSeatAvailabilityRepository seatAvailabilityRepository;

    @Override
    public Train createTrain(CreateTrainRequest request) {

        Station sourceStation = stationRepository.findById(request.getSourceStationId())
                .orElseThrow(() -> new RuntimeException("Source station not found"));

        Station destinationStation = stationRepository.findById(request.getDestinationStationId())
                .orElseThrow(() -> new RuntimeException("Destination station not found"));

        Train train = new Train();
        train.setTrainNumber(request.getTrainNumber());
        train.setTrainName(request.getTrainName());
        train.setSourceStation(sourceStation);
        train.setDestinationStation(destinationStation);
        train.setDepartureTime(request.getDepartureTime());
        train.setArrivalTime(request.getArrivalTime());
        train.setTotalSeats(request.getTotalSeats());
        train.setRunningDays(request.getRunningDays());

        return trainRepository.save(train);
    }

    @Override
    public List<TrainSearchResponse> searchTrains(SearchTrainRequest request) {

        DayOfWeek dayOfWeek = request.getTravelDate().getDayOfWeek();

        List<Train> trains = trainRepository
                .findTrainsBySourceDestinationAndDay(
                        request.getSourceStationName(),
                        request.getDestinationStationName(),
                        dayOfWeek
                );

        return trains.stream()
                .map(train -> mapToResponse(train, request))
                .collect(Collectors.toList());
    }

    private TrainSearchResponse mapToResponse(
            Train train,
            SearchTrainRequest request
    ) {

        TrainSearchResponse response = new TrainSearchResponse();

        response.setTrainId(train.getId());
        response.setTrainNumber(train.getTrainNumber());
        response.setTrainName(train.getTrainName());

        response.setSourceStation(train.getSourceStation().getName());
        response.setDestinationStation(train.getDestinationStation().getName());

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

            Station source = stationRepository.findById(request.getSourceStationId())
                    .orElseThrow(() -> new RuntimeException("Source station not found"));
            Station destination = stationRepository.findById(request.getDestinationStationId())
                    .orElseThrow(() -> new RuntimeException("Destination station not found"));

            Train train = new Train();
            train.setTrainNumber(request.getTrainNumber());
            train.setTrainName(request.getTrainName());
            train.setSourceStation(source);
            train.setDestinationStation(destination);
            train.setDepartureTime(request.getDepartureTime());
            train.setArrivalTime(request.getArrivalTime());
            train.setTotalSeats(request.getTotalSeats());
            train.setRunningDays(request.getRunningDays());

            trains.add(train);
        }

        List<Train> savedTrains = trainRepository.saveAll(trains);

        // return IDs of created trains
        return savedTrains.stream().map(Train::getId).toList();
    }
}