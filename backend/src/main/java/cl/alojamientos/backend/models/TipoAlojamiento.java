package cl.alojamientos.backend.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TipoAlojamiento {
    private Long id;
    private String nombre;
    private String descripcion;
}
