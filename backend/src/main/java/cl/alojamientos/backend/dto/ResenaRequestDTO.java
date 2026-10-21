package cl.alojamientos.backend.dto;

import lombok.Data;

@Data
public class ResenaRequestDTO {

    private Long reservaId;
    private Integer calificacion;
    private String comentario;
}
