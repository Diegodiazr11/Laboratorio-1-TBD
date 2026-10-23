package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.Temporada;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class TemporadaRepository {

    private final JdbcTemplate jdbcTemplate;

    public TemporadaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Temporada> temporadaRowMapper = (rs, RowNum) -> new Temporada(
            rs.getLong("id"),
            rs.getLong("alojamiento_id"),
            rs.getObject("fecha_inicio", LocalDate.class),
            rs.getObject("fecha_fin", LocalDate.class),
            rs.getBigDecimal("precio_noche")
    );

    public void save(Temporada temporada) {
        String sql = "INSERT INTO temporada (alojamiento_id, fecha_inicio, fecha_fin, precio_noche) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                temporada.getAlojamientoId(),
                temporada.getFechaInicio(),
                temporada.getFechaFin(),
                temporada.getPrecioNoche());
    }

    public Optional<Temporada> findById(Long id) {
        String sql = "SELECT * FROM temporada WHERE id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, temporadaRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Temporada> findByAlojamientoId(Long alojamientoId) {
        String sql = "SELECT * FROM temporada WHERE alojamiento_id = ?";
        return jdbcTemplate.query(sql, temporadaRowMapper, alojamientoId);
    }

    public void update(Temporada temporada) {
        String sql = "UPDATE temporada SET fecha_inicio = ?, fecha_fin = ?, precio_noche = ? WHERE id = ?";
        jdbcTemplate.update(sql,
                temporada.getFechaInicio(),
                temporada.getFechaFin(),
                temporada.getPrecioNoche(),
                temporada.getId());
    }

    public void delete(Long id) {
        String sql = "DELETE FROM temporada WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}
