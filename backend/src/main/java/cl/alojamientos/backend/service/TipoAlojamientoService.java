package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.TipoAlojamientoRequestDTO;
import cl.alojamientos.backend.models.TipoAlojamiento;
import cl.alojamientos.backend.repository.TipoAlojamientoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TipoAlojamientoService {

    private final TipoAlojamientoRepository tipoRepository;

    public TipoAlojamientoService(TipoAlojamientoRepository tipoRepository) {
        this.tipoRepository = tipoRepository;
    }

    public void crearTipo(TipoAlojamientoRequestDTO request) {
        TipoAlojamiento tipo = new TipoAlojamiento();
        tipo.setNombre(request.getNombre());
        tipo.setDescripcion(request.getDescripcion());
        tipoRepository.save(tipo);
    }

    public List<TipoAlojamiento> obtenerTodos() {
        return tipoRepository.findAll();
    }

    public void actualizarTipo(Long id, TipoAlojamientoRequestDTO request) {
        TipoAlojamiento tipo = new TipoAlojamiento();
        tipo.setNombre(request.getNombre());
        tipo.setDescripcion(request.getDescripcion());
        tipoRepository.update(id, tipo);
    }

    public void eliminarTipo(Long id) {
        tipoRepository.delete(id);
    }
}