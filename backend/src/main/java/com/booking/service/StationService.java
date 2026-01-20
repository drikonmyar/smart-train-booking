package com.booking.service;

import com.booking.dto.CreateStationRequest;
import com.booking.entity.Station;

import java.util.List;

public interface StationService {
    Station createStation(CreateStationRequest request);
    List<Long> createMultipleStations(List<CreateStationRequest> requests);
}
