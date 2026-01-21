package com.booking.service;

import com.booking.dto.CreateTrainRequest;
import com.booking.dto.SearchTrainRequest;
import com.booking.dto.TrainSearchResponse;
import com.booking.entity.Train;

import java.util.List;

public interface TrainService {
    Train createTrain(CreateTrainRequest request);
    List<TrainSearchResponse> searchTrains(SearchTrainRequest request);
    List<Long> createMultipleTrains(List<CreateTrainRequest> requests);
}