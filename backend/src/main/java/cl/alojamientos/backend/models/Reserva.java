package cl.alojamientos.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Reserva {
    private Long id;
    private Long alojamientoId;
    private Long huespedId;
    private LocalDate fechaCheckin;
    private LocalDate fechaCheckout;
    private Integer numHuespedes;
    private BigDecimal total;
    private String estado; // PENDIENTE, CONFIRMADA, CANCELADA, COMPLETADA
}
