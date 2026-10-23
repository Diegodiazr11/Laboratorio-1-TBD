package cl.alojamientos.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class BloqueoCalendarioRequest {
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private String motivo;
}
