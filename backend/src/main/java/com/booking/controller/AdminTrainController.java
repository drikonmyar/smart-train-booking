package com.booking.controller;

import com.booking.dto.TrainAdminDetailsResponse;
import com.booking.dto.TrainAdminRequest;
import com.booking.dto.TrainAdminResponse;
import com.booking.entity.TrainStatus;
import com.booking.service.TrainService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/trains")
@RequiredArgsConstructor
public class AdminTrainController {

    private final TrainService trainService;

    @GetMapping
    public Page<TrainAdminResponse> getTrains(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestParam(required = false) String trainNumber,
            @RequestParam(required = false) String trainName,
            @RequestParam(required = false) String sourceStation,
            @RequestParam(required = false) String destinationStation,
            @RequestParam(required = false) TrainStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate createdTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "trainNumber") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        requireAdmin(userRole);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(parseDirection(sortDir), resolveSortField(sortBy))
        );

        return trainService.getAdminTrains(
                trainNumber,
                trainName,
                sourceStation,
                destinationStation,
                status,
                createdFrom,
                createdTo,
                pageable
        );
    }

    @GetMapping("/{id}")
    public TrainAdminDetailsResponse getTrainDetails(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id
    ) {
        requireAdmin(userRole);
        return trainService.getAdminTrainDetails(id);
    }

    @PostMapping
    public ResponseEntity<TrainAdminResponse> createTrain(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @Valid @RequestBody TrainAdminRequest request
    ) {
        requireAdmin(userRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(trainService.createAdminTrain(request));
    }

    @PutMapping("/{id}")
    public TrainAdminResponse updateTrain(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id,
            @Valid @RequestBody TrainAdminRequest request
    ) {
        requireAdmin(userRole);
        return trainService.updateAdminTrain(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTrain(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean hardDelete
    ) {
        requireAdmin(userRole);
        trainService.deleteAdminTrain(id, hardDelete);
        String message = hardDelete ? "Train deleted permanently" : "Train marked as inactive";
        return ResponseEntity.ok(message);
    }

    @PatchMapping("/{id}/status")
    public TrainAdminResponse updateTrainStatus(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable Long id,
            @RequestParam(required = false) TrainStatus status
    ) {
        requireAdmin(userRole);
        return trainService.toggleTrainStatus(id, status);
    }

    private void requireAdmin(String userRole) {
        if (userRole == null || !userRole.equalsIgnoreCase("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ADMIN can access this resource");
        }
    }

    private Sort.Direction parseDirection(String sortDir) {
        return "desc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
    }

    private String resolveSortField(String sortBy) {
        if ("trainName".equalsIgnoreCase(sortBy)) {
            return "trainName";
        }
        if ("createdAt".equalsIgnoreCase(sortBy)) {
            return "createdAt";
        }
        return "trainNumber";
    }
}
