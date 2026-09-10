package com.startuphub.backend.repository;

import com.startuphub.backend.model.Startup;
import com.startuphub.backend.model.StartupVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StartupVersionRepository extends JpaRepository<StartupVersion, Long> {

    List<StartupVersion> findByStartupOrderByVersionNumberDesc(Startup startup);

    List<StartupVersion> findByStartupAndStatus(Startup startup, String status);

    void deleteByStartup(Startup startup);
}