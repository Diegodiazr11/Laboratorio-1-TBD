package cl.alojamientos.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Alojamiento {

    private Long id;
    private Long anfitrionId;
    private Long tipoId;
    private Long ciudadId;
    private Long politicaId;
    private String titulo;
    private Integer capacidadMax;
    private BigDecimal precioBaseNoche;
    private Integer estadiaMinima;
    private String estadoPublicacion; // PENDIENTE, PUBLICADO, SUSPENDIDO
}
