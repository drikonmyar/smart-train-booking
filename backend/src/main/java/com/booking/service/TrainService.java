package com.booking.service;

import com.booking.dto.SearchTrainRequest;
import com.booking.dto.TrainAdminDetailsResponse;
import com.booking.dto.TrainAdminRequest;
import com.booking.dto.TrainAdminResponse;
import com.booking.dto.TrainSearchResponse;
import com.booking.entity.TrainStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface TrainService {
    List<TrainSearchResponse> searchTrains(SearchTrainRequest request);

    Page<TrainAdminResponse> getAdminTrains(
            String trainNumber,
            String trainName,
            String sourceStation,
            String destinationStation,
            TrainStatus status,
            LocalDate createdFrom,
            LocalDate createdTo,
            Pageable pageable
    );

    TrainAdminResponse createAdminTrain(TrainAdminRequest request);

    TrainAdminResponse updateAdminTrain(Long id, TrainAdminRequest request);

    TrainAdminDetailsResponse getAdminTrainDetails(Long id);
}
