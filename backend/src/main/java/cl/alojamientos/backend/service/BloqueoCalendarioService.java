package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.BloqueoCalendarioRequest;
import cl.alojamientos.backend.models.Alojamiento;
import cl.alojamientos.backend.models.BloqueoCalendario;
import cl.alojamientos.backend.repository.AlojamientoRepository;
import cl.alojamientos.backend.repository.BloqueoCalendarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BloqueoCalendarioService {

    private final BloqueoCalendarioRepository bloqueoRepository;
    private final AlojamientoRepository alojamientoRepository;

    public BloqueoCalendarioService(BloqueoCalendarioRepository bloqueoRepository, AlojamientoRepository alojamientoRepository) {
        this.bloqueoRepository = bloqueoRepository;
        this.alojamientoRepository = alojamientoRepository;
    }

    public List<BloqueoCalendario> obtenerBloqueosPorAlojamiento(Long alojamientoId) {
        return bloqueoRepository.findByAlojamientoId(alojamientoId);
    }

    public void eliminarBloqueo(Long bloqueoId) {
        bloqueoRepository.delete(bloqueoId);
    }
}