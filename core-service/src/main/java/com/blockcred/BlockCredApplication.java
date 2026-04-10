package com.blockcred;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class BlockCredApplication {

    public static void main(String[] args) {
        SpringApplication.run(BlockCredApplication.class, args);
        System.out.println("\n" + "=".repeat(60));
        System.out.println("🚀 BlockCred System is LIVE!");
        System.out.println("👉 Open the Portal: http://localhost:5000");
        System.out.println("=".repeat(60) + "\n");
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**").allowedOrigins("*");
            }
        };
    }
}
// ./mvnw spring-boot:run
// gateway- npm start
// http://localhost:8080/h2-console
// JDBC URL:jdbc:h2:mem:blockcreddb
