package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.models.Resena;
import cl.alojamientos.backend.dto.AlojamientoRequestDTO;
import cl.alojamientos.backend.models.Alojamiento;
import cl.alojamientos.backend.service.AlojamientoService;
import cl.alojamientos.backend.service.ResenaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.math.BigDecimal;
import java.util.Map;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/alojamientos")
public class AlojamientoController {

    private final AlojamientoService alojamientoService;
    private final ResenaService resenaService;

    public AlojamientoController(AlojamientoService alojamientoService, ResenaService resenaService) {
        this.alojamientoService = alojamientoService;
        this.resenaService = resenaService;
    }

    @PostMapping
    public ResponseEntity<?> crearAlojamiento(Authentication auth,
                                              @Valid @RequestBody AlojamientoRequestDTO request){
        Long anfitrionId = (Long) auth.getDetails();
        Alojamiento creado = alojamientoService.crearAlojamiento(request, anfitrionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Alojamiento> actualizarAlojamiento(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody AlojamientoRequestDTO request) {
        Long anfitrionId = (Long) auth.getDetails();
        return ResponseEntity.ok(alojamientoService.updateLodge(id, request, anfitrionId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarAlojamiento(Authentication auth, @PathVariable Long id) {
        Long anfitrionId = (Long) auth.getDetails();
        alojamientoService.deleteLodge(id, anfitrionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/mis-publicaciones")
    public ResponseEntity<List<Alojamiento>> obtenerMisAlojamientos(Authentication auth) {
        return ResponseEntity.ok(alojamientoService.obtenerMisAlojamientos((Long) auth.getDetails()));
    }


    @GetMapping
    public ResponseEntity<List<Alojamiento>> obtenerTodosAlojamientos(){
        return ResponseEntity.ok(alojamientoService.obtenerTodosAlojamientos());
    }
    @GetMapping("/buscar")
    public ResponseEntity<List<Alojamiento>> buscarDisponibles(
            @RequestParam Long ciudadId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkin,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkout,
            @RequestParam Integer huespedes) {
        return ResponseEntity.ok(alojamientoService.searchAvailable(ciudadId, checkin, checkout, huespedes));
    }

    @GetMapping("/{id}/resenas")
    public ResponseEntity<Map<String, Object>> obtenerResumenResenas(@PathVariable Long id) {
        BigDecimal promedio = resenaService.obtainLodgeAverage(id);
        List<Resena> historial = resenaService.listarPorAlojamiento(id);

        return ResponseEntity.ok(Map.of(
                "calificacionPromedio", promedio,
                "historialResenas", historial
        ));

    }
}
