package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.TemporadaRequestDTO;
import cl.alojamientos.backend.models.Alojamiento;
import cl.alojamientos.backend.models.Temporada;
import cl.alojamientos.backend.repository.AlojamientoRepository;
import cl.alojamientos.backend.repository.TemporadaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TemporadaService {

    private final TemporadaRepository temporadaRepository;
    private final AlojamientoRepository alojamientoRepository;

    public TemporadaService(TemporadaRepository temporadaRepository, AlojamientoRepository alojamientoRepository) {
        this.temporadaRepository = temporadaRepository;
        this.alojamientoRepository = alojamientoRepository;
    }

    public void crearTemporada(Long alojamientoId, TemporadaRequestDTO request, Long anfitrionId) {
        Alojamiento alojamiento = alojamientoRepository.findById(alojamientoId)
                .orElseThrow(() -> new RuntimeException("Alojamiento no encontrado"));

        if (!alojamiento.getAnfitrionId().equals(anfitrionId)) {
            throw new RuntimeException("Acceso denegado: No eres el anfitrión de este alojamiento");
        }

        Temporada temporada = new Temporada();
        temporada.setAlojamientoId(alojamientoId);
        temporada.setFechaInicio(request.getFechaInicio());
        temporada.setFechaFin(request.getFechaFin());
        temporada.setPrecioNoche(request.getPrecioNoche());

        temporadaRepository.save(temporada);
    }

    public List<Temporada> obtenerTemporadasPorAlojamiento(Long alojamientoId) {
        return temporadaRepository.findByAlojamientoId(alojamientoId);
    }
}
