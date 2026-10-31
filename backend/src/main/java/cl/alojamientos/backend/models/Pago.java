package cl.alojamientos.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pago {

    private Long id;
    private Long reservaId;
    private BigDecimal monto;
    private LocalDateTime fechaPago;
    private String tipo;
}
