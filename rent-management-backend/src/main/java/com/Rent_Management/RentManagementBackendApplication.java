package com.Rent_Management;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class RentManagementBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(RentManagementBackendApplication.class, args);
	}

}
