package com.blockcred.controller;

import com.blockcred.model.Certificate;
import com.blockcred.repository.CertificateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    @Autowired
    private CertificateRepository repository;

    @PostMapping
    public ResponseEntity<Certificate> saveMetadata(@RequestBody Certificate certificate) {
        return ResponseEntity.ok(repository.save(certificate));
    }

    @GetMapping
    public ResponseEntity<List<Certificate>> getAll() {
        return ResponseEntity.ok(repository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Certificate> getById(@PathVariable String id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/verify/{hash}")
    public ResponseEntity<Certificate> getByHash(@PathVariable String hash) {
        return repository.findByHash(hash)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

