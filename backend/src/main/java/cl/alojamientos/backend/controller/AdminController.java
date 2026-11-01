package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.UserResponseDTO;
import cl.alojamientos.backend.models.Alojamiento;
import cl.alojamientos.backend.service.AlojamientoService;
import cl.alojamientos.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AlojamientoService alojamientoService;
    private final UserService userService;
    private final JdbcTemplate jdbcTemplate;

    public AdminController(AlojamientoService alojamientoService, UserService userService, JdbcTemplate jdbcTemplate) {
        this.alojamientoService = alojamientoService;
        this.userService = userService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        Integer totalUsers = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM usuario", Integer.class);
        Integer totalProperties = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM alojamiento WHERE estado_publicacion = 'PUBLICADO'", Integer.class);
        Integer pendingProperties = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM alojamiento WHERE estado_publicacion = 'PENDIENTE'", Integer.class);
        Integer totalBookings = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM reserva", Integer.class);

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers != null ? totalUsers : 0,
                "totalProperties", totalProperties != null ? totalProperties : 0,
                "pendingProperties", pendingProperties != null ? pendingProperties : 0,
                "totalBookings", totalBookings != null ? totalBookings : 0
        ));
    }


    @GetMapping("/usuarios")
    public ResponseEntity<List<UserResponseDTO>> listarUsuarios() {
        return ResponseEntity.ok(userService.obtenerTodos());
    }

    @PutMapping("/usuarios/{id}/estado")
    public ResponseEntity<Void> cambiarEstadoUsuario(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String rawStatus = body.getOrDefault("status", "ACTIVO");
        String estadoBd = "ACTIVO".equalsIgnoreCase(rawStatus) ? "ACTIVO" : "INACTIVO";
        jdbcTemplate.update("UPDATE usuario SET estado = ? WHERE id = ?", estadoBd, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/propiedades")
    public ResponseEntity<List<Alojamiento>> listarPropiedades() {
        return ResponseEntity.ok(alojamientoService.obtenerTodos());
    }

    @PutMapping("/propiedades/{id}/estado")
    public ResponseEntity<Void> moderarPropiedadDesdeDashboard(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "PENDIENTE");
        String estadoBd = switch (status.toUpperCase()) {
            case "APROBADA", "PUBLICADO" -> "PUBLICADO";
            case "RECHAZADA", "SUSPENDIDO" -> "SUSPENDIDO";
            default -> "PENDIENTE";
        };
        alojamientoService.changeState(id, estadoBd);
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
    public ResponseEntity<List<Map<String, Object>>> obtenerReporteOcupacion() {
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
        int filas = jdbcTemplate.update(
                "UPDATE reserva SET estado = 'COMPLETADA' " +
                        "WHERE estado = 'CONFIRMADA' AND fecha_checkout < CURRENT_DATE");
        System.out.println("Reservas completadas automáticamente: " + filas);
    }
}
