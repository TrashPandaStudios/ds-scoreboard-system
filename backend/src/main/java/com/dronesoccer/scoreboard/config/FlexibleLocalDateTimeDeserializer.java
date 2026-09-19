package com.dronesoccer.scoreboard.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Locale;

@Slf4j
public class FlexibleLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String text = p.getText();
        return parseFlexible(text);
    }

    public static LocalDateTime parseFlexible(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        text = text.trim();

        // 1. Try standard ISO-8601 e.g. "2026-09-19T09:00:00" or with milliseconds / Z
        try {
            if (text.contains("T") || (text.contains("-") && text.length() >= 19)) {
                String isoText = text;
                if (isoText.endsWith("Z")) {
                    isoText = isoText.substring(0, isoText.length() - 1);
                }
                return LocalDateTime.parse(isoText);
            }
        } catch (Exception ignored) {}

        // 2. Try 24-hour time "H:mm" or "HH:mm" or "HH:mm:ss" e.g. "09:00", "9:00", "14:30"
        try {
            if (text.matches("^\\d{1,2}:\\d{2}(:\\d{2})?$")) {
                DateTimeFormatter tf = DateTimeFormatter.ofPattern(text.length() <= 5 ? "[H:mm][HH:mm]" : "HH:mm:ss");
                LocalTime lt = LocalTime.parse(text, tf);
                return LocalDate.now().atTime(lt);
            }
        } catch (Exception ignored) {}

        // 3. Try 12-hour AM/PM formats e.g. "9:00 AM", "09:00 PM", "1:30pm"
        try {
            String upper = text.toUpperCase(Locale.ROOT).replaceAll("\\s+", " ");
            if (upper.contains("AM") || upper.contains("PM")) {
                DateTimeFormatter tf = new DateTimeFormatterBuilder()
                        .parseCaseInsensitive()
                        .appendPattern("[h:mm a][hh:mm a][h:mma][hh:mma]")
                        .toFormatter(Locale.ENGLISH);
                LocalTime lt = LocalTime.parse(upper, tf);
                return LocalDate.now().atTime(lt);
            }
        } catch (Exception ignored) {}

        // 4. Try "yyyy-MM-dd HH:mm" or "yyyy-MM-dd HH:mm:ss"
        try {
            if (text.contains(" ") && text.length() >= 16) {
                DateTimeFormatter dtf = DateTimeFormatter.ofPattern(
                        text.length() == 16 ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd HH:mm:ss"
                );
                return LocalDateTime.parse(text, dtf);
            }
        } catch (Exception ignored) {}

        log.warn("FlexibleLocalDateTimeDeserializer: Could not parse '{}', defaulting to null", text);
        return null;
    }
}
