package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.ResenaRequestDTO;
import cl.alojamientos.backend.models.Resena;
import cl.alojamientos.backend.service.ResenaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resenas")
public class ResenaController {

    private final ResenaService resenaService;

    public ResenaController(ResenaService resenaService) {
        this.resenaService = resenaService;
    }

    @GetMapping("/alojamientos/{alojamientoId}")
    public List<Resena> listarPorAlojamiento(@PathVariable Long alojamientoId) {
        return resenaService.listarPorAlojamiento(alojamientoId);
    }

    @GetMapping("/misresenas")
    public List<Resena> listarMisResenas(Authentication auth) {
        return resenaService.listarMias((Long) auth.getDetails());
    }

    @PostMapping
    public ResponseEntity<Resena> crear(Authentication auth, @Valid @RequestBody ResenaRequestDTO req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resenaService.crear(req, (Long) auth.getDetails()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(Authentication auth, @PathVariable Long id) {
        resenaService.eliminar(id, (Long) auth.getDetails());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/{id}/ocultar")
    public ResponseEntity<Void> ocultar(@PathVariable Long id) {
        resenaService.moderar(id, "OCULTA");
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/admin/{id}/mostrar")
    public ResponseEntity<Void> mostrar(@PathVariable Long id) {
        resenaService.moderar(id, "VISIBLE");
        return ResponseEntity.noContent().build();
    }
}
