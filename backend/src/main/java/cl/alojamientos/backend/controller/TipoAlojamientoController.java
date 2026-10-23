package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.TipoAlojamientoRequestDTO;
import cl.alojamientos.backend.models.TipoAlojamiento;
import cl.alojamientos.backend.service.TipoAlojamientoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tipos-alojamiento")
public class TipoAlojamientoController {

    private final TipoAlojamientoService tipoService;

    public TipoAlojamientoController(TipoAlojamientoService tipoService) {
        this.tipoService = tipoService;
    }

    @PostMapping
    public ResponseEntity<?> crearTipo(@RequestBody TipoAlojamientoRequestDTO request) {
        tipoService.crearTipo(request);
        return ResponseEntity.ok("Tipo de alojamiento creado exitosamente.");
    }

    @GetMapping
    public ResponseEntity<List<TipoAlojamiento>> obtenerTodos() {
        return ResponseEntity.ok(tipoService.obtenerTodos());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarTipo(@PathVariable Long id, @RequestBody TipoAlojamientoRequestDTO request) {
        tipoService.actualizarTipo(id, request);
        return ResponseEntity.ok("Tipo de alojamiento actualizado.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarTipo(@PathVariable Long id) {
        tipoService.eliminarTipo(id);
        return ResponseEntity.ok("Tipo de alojamiento eliminado.");
    }
}
