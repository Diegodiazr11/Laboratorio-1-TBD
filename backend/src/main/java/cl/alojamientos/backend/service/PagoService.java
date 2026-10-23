package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.PagoRequestDTO;
import cl.alojamientos.backend.models.Pago;
import cl.alojamientos.backend.repository.PagoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PagoService {

    private final PagoRepository pagoRepository;

    public PagoService(PagoRepository pagoRepository) {
        this.pagoRepository = pagoRepository;
    }

    public void registrarPago(PagoRequestDTO request) {
        Pago pago = new Pago();
        pago.setReservaId(request.getReservaId());
        pago.setMonto(request.getMonto());
        pago.setMetodoPago(request.getMetodoPago());
        pago.setFechaPago(LocalDateTime.now());
        pago.setEstado("COMPLETADO");

        pagoRepository.save(pago);
    }

    public List<Pago> obtenerPagosPorReserva(Long reservaId) {
        return pagoRepository.findByReservaId(reservaId);
    }
}