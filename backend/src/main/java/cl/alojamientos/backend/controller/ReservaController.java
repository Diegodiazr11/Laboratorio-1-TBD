package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.models.Reserva;
import cl.alojamientos.backend.service.ReservaService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
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
