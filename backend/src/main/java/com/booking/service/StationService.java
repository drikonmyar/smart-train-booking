package com.booking.service;

import com.booking.dto.CreateStationRequest;
import com.booking.dto.StationResponse;
import com.booking.dto.UpdateStationRequest;
import com.booking.entity.Station;

import java.time.LocalDate;
import java.util.List;

public interface StationService {
    Station createStation(CreateStationRequest request);
    List<StationResponse> searchStations(String query, LocalDate createdFrom, LocalDate createdTo, LocalDate modifiedFrom, LocalDate modifiedTo);
    Station updateStation(Long id, UpdateStationRequest request);
}
