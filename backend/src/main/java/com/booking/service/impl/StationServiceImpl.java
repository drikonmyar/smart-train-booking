package com.booking.service.impl;

import com.booking.dto.CreateStationRequest;
import com.booking.entity.Station;
import com.booking.repository.StationRepository;
import com.booking.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StationServiceImpl implements StationService {

    private final StationRepository stationRepository;

    @Override
    public Station createStation(CreateStationRequest request) {

        Station station = new Station();
        station.setName(request.getName());
        station.setCode(request.getCode());

        return stationRepository.save(station);
    }

    @Override
    public List<Long> createMultipleStations(List<CreateStationRequest> requests) {
        List<Station> stations = new ArrayList<>();

        for (CreateStationRequest request : requests) {
            Station station = new Station();
            station.setName(request.getName());
            station.setCode(request.getCode());
            stations.add(station);
        }

        List<Station> savedStations = stationRepository.saveAll(stations);

        // return IDs of created stations
        return savedStations.stream().map(Station::getId).toList();
    }
}
