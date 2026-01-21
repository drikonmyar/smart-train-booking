package com.booking.dto;

import lombok.Data;

@Data
public class RegisterUserRequest {

    private String fullName;
    private String email;
    private String username;
    private String password;
    private String phone;
}
