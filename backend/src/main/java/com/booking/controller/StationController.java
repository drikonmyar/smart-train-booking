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
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @PostMapping("/create")
    public ResponseEntity<Station> createStation(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestBody CreateStationRequest request) {
        requireAdmin(userRole);

        Station station = stationService.createStation(request);
        return new ResponseEntity<>(station, HttpStatus.CREATED);
    }

    @GetMapping("/search")
    public List<StationResponse> searchStations(
            @RequestParam(required = false, defaultValue = "") String q,
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
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id,
            @RequestBody UpdateStationRequest request
    ) {
        requireAdmin(userRole);
        Station updatedStation = stationService.updateStation(id, request);
        return ResponseEntity.ok(updatedStation);
    }

    private void requireAdmin(String userRole) {
        if (userRole == null || !userRole.equalsIgnoreCase("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ADMIN can access this resource");
        }
    }
}
