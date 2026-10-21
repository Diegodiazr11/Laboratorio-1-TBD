package cl.alojamientos.backend.service;

import cl.alojamientos.backend.models.Reserva;
import cl.alojamientos.backend.repository.ReservaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;

    public ReservaService(ReservaRepository reservaRepository) {
        this.reservaRepository = reservaRepository;
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