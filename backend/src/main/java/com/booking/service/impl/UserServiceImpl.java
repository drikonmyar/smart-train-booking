package com.booking.service.impl;

import com.booking.dto.LoginRequest;
import com.booking.dto.LoginResponse;
import com.booking.dto.RegisterUserRequest;
import com.booking.dto.UserResponse;
import com.booking.entity.User;
import com.booking.repository.UserRepository;
import com.booking.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserResponse registerUser(RegisterUserRequest request) {

        userRepository.findByEmail(request.getEmail())
                .ifPresent(u -> {
                    throw new RuntimeException("Email already exists");
                });

        userRepository.findByUsername(request.getUsername())
                .ifPresent(u -> {
                    throw new RuntimeException("Username already exists");
                });

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword()); // plain for now
        user.setPhone(request.getPhone());

        User savedUser = userRepository.save(user);

        UserResponse response = new UserResponse();
        response.setId(savedUser.getId());
        response.setFullName(savedUser.getFullName());
        response.setEmail(savedUser.getEmail());
        response.setUsername(savedUser.getUsername());
        response.setPhone(savedUser.getPhone());

        return response;
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        LoginResponse response = new LoginResponse();
        response.setId(user.getId());
        response.setFullName(user.getFullName());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());

        return response;
    }
}
