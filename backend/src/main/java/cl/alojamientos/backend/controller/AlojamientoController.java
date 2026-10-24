package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.AlojamientoRequestDTO;
import cl.alojamientos.backend.models.Alojamiento;
import cl.alojamientos.backend.service.AlojamientoService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.Authenticator;
import java.util.List;

@RestController
@RequestMapping("/api/alojamientos")
public class AlojamientoController {

    private final AlojamientoService alojamientoService;

    public AlojamientoController(AlojamientoService alojamientoService){
        this.alojamientoService = alojamientoService;
    }

    @PostMapping
    public ResponseEntity<?> crearAlojamiento(Authentication auth,
                                              @Valid @RequestBody AlojamientoRequestDTO request){
        Long anfitrionId = (Long) auth.getDetails();
        Alojamiento creado = alojamientoService.crearAlojamiento(request, anfitrionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @GetMapping("/mis-publicaciones")
    public ResponseEntity<List<Alojamiento>> obtenerMisAlojamientos(Authentication auth) {
        return ResponseEntity.ok(alojamientoService.obtenerMisAlojamientos((Long) auth.getDetails()));
    }

    @GetMapping
    public ResponseEntity<List<Alojamiento>> obtenerTodosAlojamientos(){
        return ResponseEntity.ok(alojamientoService.obtenerTodosAlojamientos());
    }
}
