package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.Pago;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class PagoRepository {

    private final JdbcTemplate  jdbcTemplate;

    public PagoRepository(JdbcTemplate jdbcTemplate){
        this.jdbcTemplate = jdbcTemplate;
    }
    private final RowMapper<Pago> pagoRowMapper = (rs, rowNum) -> new Pago(
            rs.getLong("id"),
            rs.getLong("reserva_id"),
            rs.getBigDecimal("monto"),
            rs.getObject("fecha_pago", LocalDateTime.class),
            rs.getString("metodo_pago"),
            rs.getString("estado")
    );

    public void save(Pago pago) {
        String sql = "INSERT INTO pago (reserva_id, monto, fecha_pago, metodo_pago, estado) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                pago.getReservaId(),
                pago.getMonto(),
                pago.getFechaPago(),
                pago.getMetodoPago(),
                pago.getEstado()
        );
    }

    public Optional<Pago> findById(Long id) {
        String sql = "SELECT * FROM pago WHERE id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, pagoRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Pago> findByReservaId(Long reservaId) {
        String sql = "SELECT * FROM pago WHERE reserva_id = ?";
        return jdbcTemplate.query(sql, pagoRowMapper, reservaId);
    }
}
