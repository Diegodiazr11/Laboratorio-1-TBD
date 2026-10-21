package cl.alojamientos.backend.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ReservaRequestDTO {

    private Long alojamientoId;
    private LocalDate fechaCheckin;
    private LocalDate fechaCheckout;
    private Integer numHuespedes;
}
