package com.blockcred.controller;

import com.blockcred.model.User;
import com.blockcred.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository repository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        return repository.findByEmail(email)
                .filter(u -> u.getPassword().equals(password))
                .map(u -> ResponseEntity.ok(Map.of(
                        "token", "fake-jwt-token-for-demo",
                        "user", u
                )))
                .orElse(ResponseEntity.status(401).body(Map.of("message", "Invalid credentials")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (repository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already registered"));
        }
        return ResponseEntity.ok(repository.save(user));
    }
}

