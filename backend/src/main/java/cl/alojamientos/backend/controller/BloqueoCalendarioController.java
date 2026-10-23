package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.BloqueoCalendarioRequest;
import cl.alojamientos.backend.models.BloqueoCalendario;
import cl.alojamientos.backend.service.BloqueoCalendarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alojamientos/{alojamientoId}/calendario")
public class BloqueoCalendarioController {

    private final BloqueoCalendarioService bloqueoService;

    public BloqueoCalendarioController(BloqueoCalendarioService bloqueoService) {
        this.bloqueoService = bloqueoService;
    }

    @PostMapping
    public ResponseEntity<?> bloquearFechas(
            @PathVariable Long alojamientoId,
            @RequestBody BloqueoCalendarioRequest request,
            Authentication authentication) {
        try {
            Long usuarioId = (Long) authentication.getDetails();
            bloqueoService.crearBloqueo(alojamientoId, request, usuarioId);
            return ResponseEntity.ok("Fechas bloqueadas exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<BloqueoCalendario>> obtenerBloqueos(@PathVariable Long alojamientoId) {
        return ResponseEntity.ok(bloqueoService.obtenerBloqueosPorAlojamiento(alojamientoId));
    }

    @DeleteMapping("/{bloqueoId}")
    public ResponseEntity<?> eliminarBloqueo(@PathVariable Long bloqueoId) {
        bloqueoService.eliminarBloqueo(bloqueoId);
        return ResponseEntity.ok("Bloqueo eliminado exitosamente.");
    }
}
