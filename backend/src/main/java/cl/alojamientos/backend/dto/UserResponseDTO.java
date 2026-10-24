package cl.alojamientos.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponseDTO {
    private Long id;
    private String nombre;
    private String email;
    private String rol;
    private String estado;
}
