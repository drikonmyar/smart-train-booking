package com.booking.service.impl;

import com.booking.dto.CreateTrainRequest;
import com.booking.dto.SearchTrainRequest;
import com.booking.entity.Station;
import com.booking.entity.Train;
import com.booking.repository.StationRepository;
import com.booking.repository.TrainRepository;
import com.booking.service.TrainService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainServiceImpl implements TrainService {

    private final TrainRepository trainRepository;
    private final StationRepository stationRepository;

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
    public List<Train> searchTrains(SearchTrainRequest request) {
        DayOfWeek dayOfWeek = request.getTravelDate().getDayOfWeek();

        return trainRepository.findTrainsBySourceDestinationAndDay(
                request.getSourceStationName(),
                request.getDestinationStationName(),
                dayOfWeek
        );
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