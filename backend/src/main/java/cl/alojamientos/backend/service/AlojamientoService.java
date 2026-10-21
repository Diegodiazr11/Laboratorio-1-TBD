package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.AlojamientoRequestDTO;
import cl.alojamientos.backend.models.Alojamiento;
import cl.alojamientos.backend.repository.AlojamientoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AlojamientoService {

    private final AlojamientoRepository alojamientoRepository;

    public AlojamientoService(AlojamientoRepository alojamientoRepository){
        this.alojamientoRepository = alojamientoRepository;
    }

    public Alojamiento crearAlojamiento(AlojamientoRequestDTO request, Long anfitrionId) {
        Alojamiento alojamiento = new Alojamiento();
        alojamiento.setAnfitrionId(anfitrionId);
        alojamiento.setTipoId(request.getTipoId());
        alojamiento.setCiudadId(request.getCiudadId());
        alojamiento.setPoliticaId(request.getPoliticaId());
        alojamiento.setTitulo(request.getTitulo());
        alojamiento.setCapacidadMax(request.getCapacidadMax());
        alojamiento.setPrecioBaseNoche(request.getPrecioBaseNoche());
        alojamiento.setEstadiaMinima(request.getEstadiaMinima() != null ? request.getEstadiaMinima() : 1);

        Long id = alojamientoRepository.save(alojamiento);
        return alojamientoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se pudo recuperar el alojamiento creado"));
    }

    public List<Alojamiento> obtenerMisAlojamientos(Long anfitrionId){
        return alojamientoRepository.findByAnfitrionId(anfitrionId);
    }
}
