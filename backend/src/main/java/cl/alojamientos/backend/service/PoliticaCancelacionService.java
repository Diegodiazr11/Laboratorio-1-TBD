package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.PoliticaCancelacionRequestDTO;
import cl.alojamientos.backend.models.PoliticaCancelacion;
import cl.alojamientos.backend.repository.PoliticaCancelacionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PoliticaCancelacionService {

    private final PoliticaCancelacionRepository politicaRepository;

    public PoliticaCancelacionService(PoliticaCancelacionRepository politicaRepository) {
        this.politicaRepository = politicaRepository;
    }

    public void crearPolitica(PoliticaCancelacionRequestDTO request) {
        PoliticaCancelacion politica = new PoliticaCancelacion();
        politica.setNombre(request.getNombre());
        politica.setDescripcion(request.getDescripcion());
        politicaRepository.save(politica);
    }

    public List<PoliticaCancelacion> obtenerTodas() {
        return politicaRepository.findAll();
    }

    public void actualizarPolitica(Long id, PoliticaCancelacionRequestDTO request) {
        PoliticaCancelacion politica = new PoliticaCancelacion();
        politica.setNombre(request.getNombre());
        politica.setDescripcion(request.getDescripcion());
        politicaRepository.update(id, politica);
    }

    public void eliminarPolitica(Long id) {
        politicaRepository.delete(id);
    }
}
