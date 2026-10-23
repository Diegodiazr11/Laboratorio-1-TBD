package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.TemporadaRequestDTO;
import cl.alojamientos.backend.models.Temporada;
import cl.alojamientos.backend.service.TemporadaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alojamientos/{alojamientoId}/tarifas")
public class TemporadaController {

    private final TemporadaService temporadaService;

    public TemporadaController(TemporadaService temporadaService) {
        this.temporadaService = temporadaService;
    }

    @PostMapping
    public ResponseEntity<?> crearTarifa(
            @PathVariable Long alojamientoId,
            @RequestBody TemporadaRequestDTO request,
            Authentication authentication) {
        try {
            Long usuarioId = (Long) authentication.getDetails();
            temporadaService.crearTemporada(alojamientoId, request, usuarioId);
            return ResponseEntity.ok("Tarifa de temporada creada exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Temporada>> obtenerTarifas(@PathVariable Long alojamientoId) {
        return ResponseEntity.ok(temporadaService.obtenerTemporadasPorAlojamiento(alojamientoId));
    }
}
