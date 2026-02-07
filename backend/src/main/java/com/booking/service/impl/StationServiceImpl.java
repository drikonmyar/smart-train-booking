package com.booking.service.impl;

import com.booking.dto.CreateStationRequest;
import com.booking.dto.StationResponse;
import com.booking.dto.UpdateStationRequest;
import com.booking.entity.Station;
import com.booking.repository.StationRepository;
import com.booking.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

    @Override
    public List<StationResponse> searchStations(String query, LocalDate createdFrom, LocalDate createdTo, LocalDate modifiedFrom, LocalDate modifiedTo) {
        String q = (query == null || query.trim().isEmpty()) ? null : query.trim();

        // Normalize date ranges
        if (createdFrom != null && createdTo != null && createdFrom.isAfter(createdTo)) {
            LocalDate temp = createdFrom;
            createdFrom = createdTo;
            createdTo = temp;
        }

        if (modifiedFrom != null && modifiedTo != null && modifiedFrom.isAfter(modifiedTo)) {
            LocalDate temp = modifiedFrom;
            modifiedFrom = modifiedTo;
            modifiedTo = temp;
        }

        List<Station> stations = stationRepository.searchStations(
                q,
                toStartOfDay(createdFrom),
                toEndOfDay(createdTo),
                toStartOfDay(modifiedFrom),
                toEndOfDay(modifiedTo)
        );

        return stations.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private LocalDateTime toStartOfDay(LocalDate date) {
        return date != null ? date.atStartOfDay() : null;
    }

    private LocalDateTime toEndOfDay(LocalDate date) {
        return date != null ? date.atTime(LocalTime.MAX) : null;
    }

    @Override
    public Station updateStation(Long id, UpdateStationRequest request) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Station not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            station.setName(request.getName());
        }

        if (request.getCode() != null && !request.getCode().isBlank()) {
            station.setCode(request.getCode().toUpperCase());
        }

//        station.setModifiedDate(LocalDateTime.now());

        return stationRepository.save(station);
    }

    private StationResponse mapToResponse(Station station) {
        StationResponse response = new StationResponse();
        response.setId(station.getId());
        response.setName(station.getName());
        response.setCode(station.getCode());
        response.setCreatedAt(station.getCreatedAt());
        response.setModifiedDate(station.getModifiedAt());
        return response;
    }
}
