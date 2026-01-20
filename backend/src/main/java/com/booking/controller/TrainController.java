package com.booking.controller;

import com.booking.dto.CreateTrainRequest;
import com.booking.dto.SearchTrainRequest;
import com.booking.entity.Train;
import com.booking.service.TrainService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trains")
@RequiredArgsConstructor
public class TrainController {

    private final TrainService trainService;

    @PostMapping("/create")
    public ResponseEntity<Train> createTrain(@RequestBody CreateTrainRequest request) {
        Train train = trainService.createTrain(request);
        return new ResponseEntity<>(train, HttpStatus.CREATED);
    }

    @PostMapping("/bulkcreate")
    public ResponseEntity<List<Long>> createMultipleTrains(@RequestBody List<CreateTrainRequest> requests) {
        List<Long> trainIds = trainService.createMultipleTrains(requests);
        return ResponseEntity.status(201).body(trainIds);
    }

    @PostMapping("/search")
    public ResponseEntity<List<Train>> searchTrains(@RequestBody SearchTrainRequest request) {
        List<Train> trains = trainService.searchTrains(request);
        return ResponseEntity.ok(trains);
    }
}
