package cl.alojamientos.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RegisterRequestDTO {

    private String nombre;
    private String email;
    private String password;
    private String rol;
}
