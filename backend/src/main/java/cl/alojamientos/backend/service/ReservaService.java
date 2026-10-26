package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.ReservaRequestDTO;
import cl.alojamientos.backend.models.Reserva;
import cl.alojamientos.backend.repository.ReservaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataAccessException;

import java.util.List;
import java.math.BigDecimal;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;

    public ReservaService(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
    }

    public Reserva crear(ReservaRequestDTO req, Long huespedId) {
        try {
            Long id = reservaRepository.confirmarReserva(
                    req.getAlojamientoId(),
                    huespedId,
                    req.getFechaCheckin(),
                    req.getFechaCheckout(),
                    req.getNumHuespedes()
            );
            return reservaRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
        } catch (DataAccessException e) {
            String msg = e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : "Error al confirmar la reserva";
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
        }
    }

    public BigDecimal cancelar(Long reservaId, Long huespedId) {
        try {
            return reservaRepository.cancelarReserva(reservaId, huespedId);
        } catch (DataAccessException e) {
            String msg = e.getMostSpecificCause() != null ? e.getMostSpecificCause().getMessage() : "Error al cancelar la reserva";
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
        }
    }

    public List<Reserva> listarReservasHuesped(Long huespedId) {
        return reservaRepository.findByHuespedId(huespedId);
    }

    public List<Reserva> listarReservasAnfitrion(Long anfitrionId) {
        return reservaRepository.findByAnfitrionId(anfitrionId);
    }

    public List<Reserva> listarTodas() {
        return reservaRepository.findAll();
    }

    public Reserva obtener(Long id, Long usuarioId, boolean esAdmin) {
        return reservaRepository.findByIdParaUsuario(id, usuarioId, esAdmin)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));
    }


}