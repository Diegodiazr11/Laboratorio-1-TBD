package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.ReservaRequestDTO;
import cl.alojamientos.backend.models.Reserva;
import cl.alojamientos.backend.service.ReservaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping
    public ResponseEntity<Reserva> crear(Authentication auth, @Valid @RequestBody ReservaRequestDTO request) {
        Long huespedId = (Long) auth.getDetails();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reservaService.crear(request, huespedId));
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<Map<String, Object>> cancelar(Authentication auth, @PathVariable Long id) {
        Long huespedId = (Long) auth.getDetails();
        BigDecimal reembolso = reservaService.cancelar(id, huespedId);
        return ResponseEntity.ok(Map.of(
                "message", "Reserva cancelada correctamente. Reembolso: $" + reembolso,
                "reembolso", reembolso
        ));
    }

    @GetMapping("/mias")
    public List<Reserva> mias(Authentication auth) {
        return reservaService.listarReservasHuesped((Long) auth.getDetails());
    }

    @GetMapping("/mis-alojamientos")
    public List<Reserva> deMisAlojamientos(Authentication auth) {
        return reservaService.listarReservasAnfitrion((Long) auth.getDetails());
    }

    @GetMapping("/admin")
    public List<Reserva> todas() {
        return reservaService.listarTodas();
    }

    @GetMapping("/{id}")
    public Reserva obtener(Authentication auth, @PathVariable Long id) {
        boolean esAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRADOR"));
        return reservaService.obtener(id, (Long) auth.getDetails(), esAdmin);
    }
}
