package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.CiudadRequestDTO;
import cl.alojamientos.backend.models.Ciudad;
import cl.alojamientos.backend.repository.CiudadRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CiudadService {

    private final CiudadRepository ciudadRepository;

    public CiudadService(CiudadRepository ciudadRepository) {
        this.ciudadRepository = ciudadRepository;
    }

    public List<Ciudad> listar() {
        return ciudadRepository.findAll();
    }

    public Ciudad obtener(Long id) {
        return ciudadRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ciudad no encontrada"));
    }

    public Ciudad crear(CiudadRequestDTO request) {
        try {
            Long id = ciudadRepository.save(request.getNombre());
            return obtener(id);
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una ciudad con ese nombre");
        }
    }

    public Ciudad actualizar(Long id, CiudadRequestDTO request) {
        try {
            if (ciudadRepository.update(id, request.getNombre()) == 0) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ciudad no encontrada");
            }
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una ciudad con ese nombre");
        }
        return obtener(id);
    }

    public void eliminar(Long id) {
        try {
            if (ciudadRepository.delete(id) == 0) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ciudad no encontrada");
            }
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar: hay alojamientos en esta ciudad");
        }
    }
}
