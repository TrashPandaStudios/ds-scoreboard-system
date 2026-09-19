package com.dronesoccer.scoreboard.service;

import com.dronesoccer.scoreboard.model.dto.TeamDTO;
import com.dronesoccer.scoreboard.model.dto.TeamLogoUpdatedEvent;
import com.dronesoccer.scoreboard.model.entity.Team;
import com.dronesoccer.scoreboard.repository.TeamRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService implements TeamLogoResolver {

    private final TeamRepository teamRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${scoreboard.storage.logos-path:./data/logos}")
    private String logosPathString;

    private Path logosPath;

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("png", "jpg", "jpeg", "svg", "webp");
    private static final String LOGO_URL_PREFIX = "/api/teams/logos/";

    @PostConstruct
    public void init() {
        try {
            this.logosPath = Paths.get(logosPathString).toAbsolutePath().normalize();
            Files.createDirectories(this.logosPath);
            log.info("Initialized Team Logo storage directory at: {}", this.logosPath);
        } catch (IOException e) {
            log.error("Failed to create team logos directory: {}", e.getMessage(), e);
            throw new RuntimeException("Could not initialize team logos directory", e);
        }
    }

    public List<TeamDTO> getAllTeams() {
        return teamRepository.findAllByOrderByNameAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Optional<TeamDTO> getTeamById(Long id) {
        return teamRepository.findById(id).map(this::toDTO);
    }

    public Optional<TeamDTO> getTeamByName(String name) {
        if (name == null || name.isBlank()) return Optional.empty();
        return teamRepository.findByNameIgnoreCase(name.trim()).map(this::toDTO);
    }

    @Override
    public String resolveLogoUrl(String teamName) {
        if (teamName == null || teamName.isBlank()) return null;
        return teamRepository.findByNameIgnoreCase(teamName.trim())
                .map(Team::getLogoUrl)
                .orElse(null);
    }

    @Transactional
    public Team autoProvisionTeam(String teamName) {
        if (teamName == null || teamName.isBlank()) return null;
        String trimmed = teamName.trim();
        return teamRepository.findByNameIgnoreCase(trimmed)
                .orElseGet(() -> {
                    Team created = Team.builder()
                            .name(trimmed)
                            .logoUrl(null)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    Team saved = teamRepository.save(created);
                    log.info("Auto-provisioned stub team in registry: '{}' (ID: {})", saved.getName(), saved.getId());
                    return saved;
                });
    }

    @Transactional
    public void autoProvisionTeams(Collection<String> teamNames) {
        if (teamNames == null) return;
        for (String name : teamNames) {
            if (name != null && !name.isBlank()) {
                autoProvisionTeam(name);
            }
        }
    }

    @Transactional
    public TeamDTO createOrUpdateTeam(TeamDTO dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new IllegalArgumentException("Team name cannot be blank");
        }
        String trimmedName = dto.getName().trim();

        Team team;
        if (dto.getId() != null) {
            team = teamRepository.findById(dto.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Team not found with ID: " + dto.getId()));
            String oldName = team.getName();
            team.setName(trimmedName);
            if (dto.getLogoUrl() != null) {
                team.setLogoUrl(dto.getLogoUrl());
            }
            team.setUpdatedAt(LocalDateTime.now());
            Team saved = teamRepository.save(team);
            if (!oldName.equalsIgnoreCase(saved.getName())) {
                eventPublisher.publishEvent(new TeamLogoUpdatedEvent(oldName, null));
                eventPublisher.publishEvent(new TeamLogoUpdatedEvent(saved.getName(), saved.getLogoUrl()));
            }
            return toDTO(saved);
        } else {
            Optional<Team> existing = teamRepository.findByNameIgnoreCase(trimmedName);
            if (existing.isPresent()) {
                team = existing.get();
                if (dto.getLogoUrl() != null) {
                    team.setLogoUrl(dto.getLogoUrl());
                }
                team.setUpdatedAt(LocalDateTime.now());
            } else {
                team = Team.builder()
                        .name(trimmedName)
                        .logoUrl(dto.getLogoUrl())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
            }
            Team saved = teamRepository.save(team);
            eventPublisher.publishEvent(new TeamLogoUpdatedEvent(saved.getName(), saved.getLogoUrl()));
            return toDTO(saved);
        }
    }

    @Transactional
    public TeamDTO uploadLogo(Long teamId, MultipartFile file) throws IOException {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found with ID: " + teamId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size exceeds 5MB limit");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "logo.png"));
        String extension = getFileExtension(originalFilename).toLowerCase(Locale.ROOT);

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported file format ." + extension + ". Allowed: PNG, JPG, JPEG, SVG, WebP");
        }

        // Delete previous logo file if it was a local file
        deleteLocalLogoFile(team.getLogoUrl());

        // Generate unique safe filename
        String uniqueFilename = "team-" + team.getId() + "-" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;
        Path destination = logosPath.resolve(uniqueFilename).normalize();

        if (!destination.getParent().equals(logosPath)) {
            throw new SecurityException("Cannot store file outside target directory");
        }

        try (InputStream is = file.getInputStream()) {
            Files.copy(is, destination, StandardCopyOption.REPLACE_EXISTING);
        }

        String newLogoUrl = LOGO_URL_PREFIX + uniqueFilename;
        team.setLogoUrl(newLogoUrl);
        team.setUpdatedAt(LocalDateTime.now());
        Team saved = teamRepository.save(team);

        log.info("Uploaded team logo for '{}' saved as '{}'", team.getName(), uniqueFilename);
        eventPublisher.publishEvent(new TeamLogoUpdatedEvent(saved.getName(), saved.getLogoUrl()));

        return toDTO(saved);
    }

    @Transactional
    public TeamDTO clearLogo(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found with ID: " + teamId));

        deleteLocalLogoFile(team.getLogoUrl());
        team.setLogoUrl(null);
        team.setUpdatedAt(LocalDateTime.now());
        Team saved = teamRepository.save(team);

        log.info("Cleared team logo for '{}'", team.getName());
        eventPublisher.publishEvent(new TeamLogoUpdatedEvent(saved.getName(), null));

        return toDTO(saved);
    }

    @Transactional
    public void deleteTeam(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found with ID: " + teamId));

        String teamName = team.getName();
        deleteLocalLogoFile(team.getLogoUrl());
        teamRepository.delete(team);

        log.info("Deleted team '{}' (ID: {})", teamName, teamId);
        eventPublisher.publishEvent(new TeamLogoUpdatedEvent(teamName, null));
    }

    public Resource loadLogoAsResource(String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new IllegalArgumentException("Invalid filename");
        }
        Path filePath = logosPath.resolve(filename).normalize();
        if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
            return null;
        }
        return new FileSystemResource(filePath.toFile());
    }

    public MediaType getMediaTypeForFilename(String filename) {
        String ext = getFileExtension(filename).toLowerCase(Locale.ROOT);
        return switch (ext) {
            case "png" -> MediaType.IMAGE_PNG;
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
            case "svg" -> MediaType.valueOf("image/svg+xml");
            case "webp" -> MediaType.valueOf("image/webp");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }

    private void deleteLocalLogoFile(String logoUrl) {
        if (logoUrl != null && logoUrl.startsWith(LOGO_URL_PREFIX)) {
            String filename = logoUrl.substring(LOGO_URL_PREFIX.length());
            if (!filename.contains("..") && !filename.contains("/") && !filename.contains("\\")) {
                try {
                    Path fileToDelete = logosPath.resolve(filename).normalize();
                    if (Files.exists(fileToDelete)) {
                        Files.delete(fileToDelete);
                        log.info("Deleted old local logo file: {}", fileToDelete);
                    }
                } catch (IOException e) {
                    log.warn("Failed to delete local logo file {}: {}", filename, e.getMessage());
                }
            }
        }
    }

    private String getFileExtension(String filename) {
        int dotIdx = filename.lastIndexOf('.');
        return (dotIdx >= 0) ? filename.substring(dotIdx + 1) : "";
    }

    private TeamDTO toDTO(Team entity) {
        return TeamDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .logoUrl(entity.getLogoUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
