package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.UserResponseDTO;
import cl.alojamientos.backend.models.Alojamiento;
import cl.alojamientos.backend.service.AlojamientoService;
import cl.alojamientos.backend.service.ReservaService;
import cl.alojamientos.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AlojamientoService alojamientoService;
    private final UserService userService;
    private final ReservaService reservaService;

    public AdminController(
            AlojamientoService alojamientoService,
            UserService userService,
            ReservaService reservaService) {
        this.alojamientoService = alojamientoService;
        this.userService = userService;
        this.reservaService = reservaService;
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        return ResponseEntity.ok(Map.of(
                "totalUsers", userService.contarUsuarios(),
                "totalProperties", alojamientoService.contarPorEstado("PUBLICADO"),
                "pendingProperties", alojamientoService.contarPorEstado("PENDIENTE"),
                "totalBookings", reservaService.contarReservas()
        ));
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<UserResponseDTO>> listarUsuarios() {
        return ResponseEntity.ok(userService.obtenerTodos());
    }

    @PutMapping("/usuarios/{id}/estado")
    public ResponseEntity<Void> cambiarEstadoUsuario(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String rawStatus = body.getOrDefault("status", "ACTIVO");
        userService.cambiarEstadoUsuario(id, rawStatus);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/propiedades")
    public ResponseEntity<List<Alojamiento>> listarPropiedades() {
        return ResponseEntity.ok(alojamientoService.obtenerTodos());
    }

    @PutMapping("/propiedades/{id}/estado")
    public ResponseEntity<Void> moderarPropiedadDesdeDashboard(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "PENDIENTE");
        alojamientoService.moderarPropiedadDesdeDashboard(id, status);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/alojamientos/{id}/estado")
    public ResponseEntity<Void> moderarAlojamiento(
            @PathVariable Long id,
            @RequestParam String estado) {
        alojamientoService.changeState(id, estado);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reportes/ocupacion-ingresos")
    public ResponseEntity<List> obtenerReporteOcupacion() {
        alojamientoService.refreshOccupationReport();
        return ResponseEntity.ok(alojamientoService.obtainOccupationReport());
    }

    @PostMapping("/reportes/ocupacion-ingresos/refrescar")
    @Scheduled(cron = "0 0 0 * * *")
    public ResponseEntity<Map<String, String>> refrescarReporte() {
        alojamientoService.refreshOccupationReport();
        return ResponseEntity.ok(Map.of("mensaje", "Vista materializada actualizada correctamente"));
    }

    @Scheduled(cron = "0 0 1 * * *")
    public void completarReservasVencidas() {
        int filas = reservaService.completarReservasVencidas();
        System.out.println("Reservas completadas automáticamente: " + filas);
    }
}