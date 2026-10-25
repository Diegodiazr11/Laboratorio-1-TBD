package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.BloqueoCalendario;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public class BloqueoCalendarioRepository {

    private final JdbcTemplate jdbcTemplate;

    public BloqueoCalendarioRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<BloqueoCalendario> bloqueoRowMapper = (rs, rowNum) -> new BloqueoCalendario(
            rs.getLong("alojamiento_id"),
            rs.getObject("fecha", LocalDate.class),
            rs.getLong("reserva_id")
    );

    public List<BloqueoCalendario> findByAlojamientoId(Long alojamientoId) {
        String sql = "SELECT alojamiento_id, fecha, reserva_id FROM bloqueo_calendario " +
                "WHERE alojamiento_id = ? ORDER BY fecha";
        return jdbcTemplate.query(sql, bloqueoRowMapper, alojamientoId);
    }

    public void delete(Long id) {
        String sql = "DELETE FROM bloqueo_calendario WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}
