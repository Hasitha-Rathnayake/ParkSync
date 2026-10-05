package com.parksync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // needed for Member 6's scheduled reminder notifications
public class ParkSyncApplication {
    public static void main(String[] args) {
        SpringApplication.run(ParkSyncApplication.class, args);
    }
}

/*
cd "C:\Users\hasit\Downloads\ParkSync_Full_Project with all validations\parksync\frontend"
npm install
npm run dev
 */