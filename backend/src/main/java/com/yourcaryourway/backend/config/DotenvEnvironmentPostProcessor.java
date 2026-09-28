package com.yourcaryourway.backend.config;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Loads a ".env" file (KEY=VALUE per line) from the working directory, if present,
 * so that ports/URLs stay out of source code and application.properties placeholders
 * (e.g. ${SERVER_PORT:8080}) can be overridden per environment without exporting
 * real OS environment variables. Real OS env vars / system properties still win,
 * since this source is registered with the lowest precedence.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		Path dotenv = Path.of(".env");
		if (!Files.isRegularFile(dotenv)) {
			return;
		}
		Properties props = new Properties();
		try (InputStream in = Files.newInputStream(dotenv)) {
			props.load(in);
		} catch (IOException e) {
			throw new IllegalStateException("Failed to read .env file", e);
		}
		Map<String, Object> values = new LinkedHashMap<>();
		props.forEach((key, value) -> values.put(String.valueOf(key), value));
		if (!values.isEmpty()) {
			environment.getPropertySources().addLast(new MapPropertySource("dotenv", values));
		}
	}
}
