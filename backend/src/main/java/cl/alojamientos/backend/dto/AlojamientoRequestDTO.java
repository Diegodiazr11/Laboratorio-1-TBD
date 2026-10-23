package cl.alojamientos.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class AlojamientoRequestDTO {
    private Long tipoId;
    private Long ciudadId;
    private Long politicaId;
    private String titulo;
    private Integer capacidadMax;
    private BigDecimal precioBaseNoche;
    private Integer estadiaMinima;
}
