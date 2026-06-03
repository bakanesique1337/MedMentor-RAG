package ru.medmentor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MedMentorRAGApplication {

	static void main(String[] args) {
		SpringApplication.run(MedMentorRAGApplication.class, args);
	}

}
