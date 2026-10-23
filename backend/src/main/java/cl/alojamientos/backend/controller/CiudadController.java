package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.CiudadRequestDTO;
import cl.alojamientos.backend.models.Ciudad;
import cl.alojamientos.backend.service.CiudadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ciudades")
public class CiudadController {

    private final CiudadService ciudadService;

    public CiudadController(CiudadService ciudadService) {
        this.ciudadService = ciudadService;
    }

    @GetMapping
    public List<Ciudad> listar() {
        return ciudadService.listar();
    }

    @GetMapping("/{id}")
    public Ciudad obtener(@PathVariable Long id) {
        return ciudadService.obtener(id);
    }

    @PostMapping
    public ResponseEntity<Ciudad> crear(@Valid @RequestBody CiudadRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ciudadService.crear(request));
    }

    @PutMapping("/{id}")
    public Ciudad actualizar(@PathVariable Long id, @Valid @RequestBody CiudadRequestDTO request) {
        return ciudadService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        ciudadService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
