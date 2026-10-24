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

    public List<Alojamiento> searchAvailable(Long ciudadId, java.time.LocalDate checkin, java.time.LocalDate checkout, Integer huespedes) {
        if (!checkout.isAfter(checkin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de checkout no puede ser previa a la fecha de checkin");
        }
        return alojamientoRepository.searchAvailable(ciudadId, checkin, checkout, huespedes);
    }

    public Alojamiento updateLodge(Long id, AlojamientoRequestDTO request, Long anfitrionId) {
        Alojamiento alojamiento = new Alojamiento();
        alojamiento.setId(id);
        alojamiento.setAnfitrionId(anfitrionId);
        alojamiento.setTipoId(request.getTipoId());
        alojamiento.setCiudadId(request.getCiudadId());
        alojamiento.setPoliticaId(request.getPoliticaId());
        alojamiento.setTitulo(request.getTitulo());
        alojamiento.setCapacidadMax(request.getCapacidadMax());
        alojamiento.setPrecioBaseNoche(request.getPrecioBaseNoche());
        alojamiento.setEstadiaMinima(request.getEstadiaMinima() != null ? request.getEstadiaMinima() : 1);

        if (alojamientoRepository.update(alojamiento) == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Alojamiento no encontrado / No tiene permisos para editar");
        }
        return alojamientoRepository.findById(id).orElseThrow();
    }

    public void deleteLodge(Long id, Long anfitrionId) {
        if (alojamientoRepository.delete(id, anfitrionId) == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Alojamiento no encontrado / No tiene permisos para editar");
        }
    }

    public void changeState(Long id, String nuevoEstado) {
        if (!List.of("PENDIENTE", "PUBLICADO", "SUSPENDIDO").contains(nuevoEstado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inválido");
        }
        if (alojamientoRepository.changePostState(id, nuevoEstado) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Alojamiento no encontrado");
        }
    }

    public List<Alojamiento> obtenerTodosAlojamientosPublicados(){
        return alojamientoRepository.findPublicados();
    }

    public List<Alojamiento> obtenerTodos() {
        return alojamientoRepository.findAll();
    }

}
