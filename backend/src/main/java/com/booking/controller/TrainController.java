package com.booking.controller;

import com.booking.dto.SearchTrainRequest;
import com.booking.dto.TrainSearchResponse;
import com.booking.service.TrainService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trains")
@RequiredArgsConstructor
public class TrainController {

    private final TrainService trainService;

    @PostMapping("/search")
    public List<TrainSearchResponse> searchTrains(@RequestBody SearchTrainRequest request) {
        return trainService.searchTrains(request);
    }
}
