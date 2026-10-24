package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.PagoRequestDTO;
import cl.alojamientos.backend.models.Pago;
import cl.alojamientos.backend.service.PagoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pago")
public class PagoController {

    private final PagoService pagoService;

    public PagoController(PagoService pagoService) {
        this.pagoService = pagoService;
    }

    @PostMapping
    public ResponseEntity<?> registrarPago(@RequestBody PagoRequestDTO request) {
        try {
            pagoService.registrarPago(request);
            return ResponseEntity.ok("Pago registrado exitosamente.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/reserva/{reservaId}")
    public ResponseEntity<List<Pago>> obtenerPagosDeReserva(@PathVariable Long reservaId) {
        return ResponseEntity.ok(pagoService.obtenerPagosPorReserva(reservaId));
    }
}
