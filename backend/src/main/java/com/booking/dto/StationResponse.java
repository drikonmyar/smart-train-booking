package com.booking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StationResponse {
    private Long id;
    private String name;
    private String code;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedDate;
}
