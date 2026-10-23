package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.PoliticaCancelacionRequestDTO;
import cl.alojamientos.backend.models.PoliticaCancelacion;
import cl.alojamientos.backend.service.PoliticaCancelacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/politicas-cancelacion")
public class PoliticaCancelacionController {

    private final PoliticaCancelacionService politicaService;

    public PoliticaCancelacionController(PoliticaCancelacionService politicaService) {
        this.politicaService = politicaService;
    }

    @PostMapping
    public ResponseEntity<?> crearPolitica(@RequestBody PoliticaCancelacionRequestDTO request) {
        politicaService.crearPolitica(request);
        return ResponseEntity.ok("Política de cancelación creada exitosamente.");
    }

    @GetMapping
    public ResponseEntity<List<PoliticaCancelacion>> obtenerTodas() {
        return ResponseEntity.ok(politicaService.obtenerTodas());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarPolitica(@PathVariable Long id, @RequestBody PoliticaCancelacionRequestDTO request) {
        politicaService.actualizarPolitica(id, request);
        return ResponseEntity.ok("Política de cancelación actualizada.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarPolitica(@PathVariable Long id) {
        politicaService.eliminarPolitica(id);
        return ResponseEntity.ok("Política de cancelación eliminada.");
    }
}