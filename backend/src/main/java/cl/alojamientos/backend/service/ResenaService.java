package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.ResenaRequestDTO;
import cl.alojamientos.backend.models.Resena;
import cl.alojamientos.backend.repository.ResenaRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;

import java.util.List;

@Service
public class ResenaService {

    private final ResenaRepository resenaRepository;

    public ResenaService(ResenaRepository resenaRepository) {
        this.resenaRepository = resenaRepository;
    }

    public List<Resena> listarPorAlojamiento(Long alojamientoId) {
        return resenaRepository.findByAlojamientoId(alojamientoId);
    }

    public List<Resena> listarMias(Long huespedId) {
        return resenaRepository.findByHuespedId(huespedId);
    }

    public Resena crear(ResenaRequestDTO req, Long huespedId) {
        try {
            Long id = resenaRepository
                    .save(req.getReservaId(), huespedId, req.getCalificacion(), req.getComentario())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Solo puedes reseñar tus propias estadías completadas"));
            return obtener(id);
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya reseñaste esta estadía");
        }
    }

    public void eliminar(Long id, Long huespedId) {
        if (resenaRepository.delete(id, huespedId) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reseña no encontrada o no te pertenece");
        }
    }

    public void moderar(Long id, String estado) {
        if (resenaRepository.cambiarEstado(id, estado) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reseña no encontrada");
        }
    }

    private Resena obtener(Long id) {
        return resenaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reseña no encontrada"));
    }

    public BigDecimal obtainLodgeAverage(Long alojamientoId) {
        return resenaRepository.obtainLodgeAverage(alojamientoId);
    }
}