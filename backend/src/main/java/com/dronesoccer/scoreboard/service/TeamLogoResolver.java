package com.dronesoccer.scoreboard.service;

@FunctionalInterface
public interface TeamLogoResolver {
    String resolveLogoUrl(String teamName);
}
