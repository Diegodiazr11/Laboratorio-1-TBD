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
            rs.getLong("id"),
            rs.getLong("alojamiento_id"),
            rs.getObject("fecha_inicio", LocalDate.class),
            rs.getObject("fecha_fin", LocalDate.class),
            rs.getString("motivo")
    );

    public void save(BloqueoCalendario bloqueo) {
        String sql = "INSERT INTO bloqueo_calendario (alojamiento_id, fecha_inicio, fecha_fin, motivo) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                bloqueo.getAlojamientoId(),
                bloqueo.getFechaInicio(),
                bloqueo.getFechaFin(),
                bloqueo.getMotivo());
    }

    public List<BloqueoCalendario> findByAlojamientoId(Long alojamientoId) {
        String sql = "SELECT * FROM bloqueo_calendario WHERE alojamiento_id = ?";
        return jdbcTemplate.query(sql, bloqueoRowMapper, alojamientoId);
    }

    public void delete(Long id) {
        String sql = "DELETE FROM bloqueo_calendario WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}
