package com.blockcred.repository;

import com.blockcred.model.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CertificateRepository extends JpaRepository<Certificate, String> {
    Optional<Certificate> findByHash(String hash);
}

