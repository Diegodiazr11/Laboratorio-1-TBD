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

    public void crearBloqueo(Long alojamientoId, BloqueoCalendarioRequest request, Long anfitrionId) {
        Alojamiento alojamiento = alojamientoRepository.findById(alojamientoId)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado"));

        if (!alojamiento.getAnfitrionId().equals(anfitrionId)) {
            throw new RuntimeException("Acceso denegado: No eres el anfitrión de este alojamiento");
        }

        BloqueoCalendario bloqueo = new BloqueoCalendario();
        bloqueo.setAlojamientoId(alojamientoId);
        bloqueo.setFechaInicio(request.getFechaInicio());
        bloqueo.setFechaFin(request.getFechaFin());
        bloqueo.setMotivo(request.getMotivo());

        bloqueoRepository.save(bloqueo);
    }

    public List<BloqueoCalendario> obtenerBloqueosPorAlojamiento(Long alojamientoId) {
        return bloqueoRepository.findByAlojamientoId(alojamientoId);
    }

    public void eliminarBloqueo(Long bloqueoId) {
        bloqueoRepository.delete(bloqueoId);
    }
}