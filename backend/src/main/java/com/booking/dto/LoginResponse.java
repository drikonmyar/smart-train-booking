package com.booking.dto;

import lombok.Data;

@Data
public class LoginResponse {

    private Long id;
    private String fullName;
    private String username;
    private String email;
}
