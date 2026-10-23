package cl.alojamientos.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Resena {

    private Long id;
    private Long reservaId;
    private Integer calificacion;   // 1 a 5
    private String comentario;
    private String estado;          // VISIBLE, OCULTA
    private OffsetDateTime fecha;
}
