package com.dronesoccer.scoreboard.service;

import com.dronesoccer.scoreboard.model.dto.MatchScheduleRequest;
import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import com.dronesoccer.scoreboard.repository.ScheduledMatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TournamentQueueService {

    private final ScheduledMatchRepository scheduledMatchRepository;

    public List<ScheduledMatch> getAllScheduledMatches() {
        return scheduledMatchRepository.findAllByOrderByOrderIndexAsc();
    }

    public List<ScheduledMatch> getPendingMatchesForArena(Long arenaId) {
        return scheduledMatchRepository.findByArenaIdAndStatusOrderByOrderIndexAsc(arenaId, "SCHEDULED");
    }

    public ScheduledMatch createScheduledMatch(MatchScheduleRequest request) {
        int nextOrder = (int) scheduledMatchRepository.count();
        ScheduledMatch match = ScheduledMatch.builder()
                .matchNumber(request.getMatchNumber() != null ? request.getMatchNumber() : "M-" + (nextOrder + 1))
                .tournamentName(request.getTournamentName() != null ? request.getTournamentName() : "Drone Soccer Cup")
                .arenaId(request.getArenaId() != null ? request.getArenaId() : 1L)
                .teamRed(request.getTeamRed() != null ? request.getTeamRed() : "Red Team")
                .teamBlue(request.getTeamBlue() != null ? request.getTeamBlue() : "Blue Team")
                .scheduledTime(request.getScheduledTime() != null ? request.getScheduledTime() : LocalDateTime.now().plusMinutes(15))
                .status("SCHEDULED")
                .orderIndex(nextOrder)
                .createdAt(LocalDateTime.now())
                .build();

        return scheduledMatchRepository.save(match);
    }

    @Transactional
    public ScheduledMatch updateStatus(Long id, String status) {
        Optional<ScheduledMatch> opt = scheduledMatchRepository.findById(id);
        if (opt.isPresent()) {
            ScheduledMatch match = opt.get();
            match.setStatus(status);
            return scheduledMatchRepository.save(match);
        }
        return null;
    }

    @Transactional
    public void deleteScheduledMatch(Long id) {
        scheduledMatchRepository.deleteById(id);
    }
}
