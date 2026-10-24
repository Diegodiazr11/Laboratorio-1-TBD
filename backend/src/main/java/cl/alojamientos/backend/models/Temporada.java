package cl.alojamientos.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Temporada {
    private Long id;
    private Long alojamientoId;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private BigDecimal precioNoche;
}
