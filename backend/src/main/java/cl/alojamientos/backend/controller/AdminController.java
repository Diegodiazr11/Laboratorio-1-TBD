package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.service.AlojamientoService;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AlojamientoService alojamientoService;
    private final JdbcTemplate jdbcTemplate;

    public AdminController(AlojamientoService alojamientoService, JdbcTemplate jdbcTemplate) {
        this.alojamientoService = alojamientoService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PatchMapping("/alojamientos/{id}/estado")
    public ResponseEntity<Void> moderarAlojamiento(
            @PathVariable Long id,
            @RequestParam String estado) {
        alojamientoService.changeState(id, estado);
        return ResponseEntity.noContent().build();
    }

   // FALTA IMPLEMENTAR EL REPORTE Y REFRESH DE LA VISTA ACTUALIZADA
}
