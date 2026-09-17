package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.model.entity.SponsorItem;
import com.dronesoccer.scoreboard.repository.SponsorItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sponsors")
@RequiredArgsConstructor
public class SponsorRestController {

    private final SponsorItemRepository sponsorItemRepository;

    @GetMapping
    public ResponseEntity<List<SponsorItem>> getActiveSponsors() {
        return ResponseEntity.ok(sponsorItemRepository.findByActiveTrueOrderByOrderIndexAsc());
    }

    @GetMapping("/all")
    public ResponseEntity<List<SponsorItem>> getAllSponsors() {
        return ResponseEntity.ok(sponsorItemRepository.findAllByOrderByOrderIndexAsc());
    }

    @PostMapping
    public ResponseEntity<SponsorItem> createSponsor(@RequestBody SponsorItem item) {
        return ResponseEntity.ok(sponsorItemRepository.save(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SponsorItem> updateSponsor(@PathVariable Long id, @RequestBody SponsorItem updated) {
        return sponsorItemRepository.findById(id)
                .map(item -> {
                    item.setName(updated.getName());
                    item.setLogoUrl(updated.getLogoUrl());
                    item.setTagline(updated.getTagline());
                    item.setDisplayDurationSec(updated.getDisplayDurationSec());
                    item.setActive(updated.isActive());
                    item.setOrderIndex(updated.getOrderIndex());
                    return ResponseEntity.ok(sponsorItemRepository.save(item));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSponsor(@PathVariable Long id) {
        sponsorItemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
