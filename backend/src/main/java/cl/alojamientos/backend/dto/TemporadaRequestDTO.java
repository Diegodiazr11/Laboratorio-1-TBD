package cl.alojamientos.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TemporadaRequestDTO {
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private BigDecimal precioNoche;
}
