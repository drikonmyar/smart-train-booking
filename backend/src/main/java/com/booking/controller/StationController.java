package com.booking.controller;

import com.booking.dto.CreateStationRequest;
import com.booking.entity.Station;
import com.booking.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @PostMapping("/create")
    public ResponseEntity<Station> createStation(
            @RequestBody CreateStationRequest request) {

        Station station = stationService.createStation(request);
        return new ResponseEntity<>(station, HttpStatus.CREATED);
    }

    @PostMapping("/bulkcreate")
    public ResponseEntity<List<Long>> createMultipleStations(@RequestBody List<CreateStationRequest> requests) {
        List<Long> stationIds = stationService.createMultipleStations(requests);
        return ResponseEntity.status(201).body(stationIds);
    }
}
