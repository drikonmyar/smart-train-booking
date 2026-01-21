package com.booking.service;

import com.booking.dto.LoginRequest;
import com.booking.dto.LoginResponse;
import com.booking.dto.RegisterUserRequest;
import com.booking.dto.UserResponse;

public interface UserService {

    UserResponse registerUser(RegisterUserRequest request);
    LoginResponse login(LoginRequest request);
}
