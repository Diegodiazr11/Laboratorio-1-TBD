package cl.alojamientos.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BloqueoCalendario {
    private Long alojamientoId;
    private LocalDate fecha;
    private Long reservaId;
}
