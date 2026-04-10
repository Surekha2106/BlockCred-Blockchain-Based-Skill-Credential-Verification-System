package com.blockcred;

import com.blockcred.model.User;
import com.blockcred.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SeedData implements CommandLineRunner {

    private final UserRepository repository;

    public SeedData(UserRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() == 0) {
            User admin = new User("john.doe@example.com", "password", "John Doe", "ADMIN");
            repository.save(admin);
            System.out.println("Seeded test admin user: john.doe@example.com / password");
        }
    }
}
