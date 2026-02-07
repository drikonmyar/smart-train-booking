package com.booking.controller;

import com.booking.dto.CreateStationRequest;
import com.booking.dto.StationResponse;
import com.booking.dto.UpdateStationRequest;
import com.booking.entity.Station;
import com.booking.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    @GetMapping("/search")
    public List<StationResponse> searchStations(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate modifiedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate modifiedTo
    ) {
        return stationService.searchStations(
                q, createdFrom, createdTo, modifiedFrom, modifiedTo
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Station> updateStation(
            @PathVariable Long id,
            @RequestBody UpdateStationRequest request
    ) {
        Station updatedStation = stationService.updateStation(id, request);
        return ResponseEntity.ok(updatedStation);
    }
}
