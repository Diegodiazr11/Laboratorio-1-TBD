package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.TipoAlojamiento;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class TipoAlojamientoRepository {

    private final JdbcTemplate jdbcTemplate;

    public TipoAlojamientoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<TipoAlojamiento> tipoRowMapper = (rs, rowNum) -> new TipoAlojamiento(
            rs.getLong("id"),
            rs.getString("nombre"),
            rs.getString("descripcion")
    );

    public void save(TipoAlojamiento tipo) {
        String sql = "INSERT INTO tipo_alojamiento (nombre, descripcion) VALUES (?, ?)";
        jdbcTemplate.update(sql, tipo.getNombre(), tipo.getDescripcion());
    }

    public List<TipoAlojamiento> findAll() {
        String sql = "SELECT * FROM tipo_alojamiento";
        return jdbcTemplate.query(sql, tipoRowMapper);
    }

    public Optional<TipoAlojamiento> findById(Long id) {
        String sql = "SELECT * FROM tipo_alojamiento WHERE id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, tipoRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void update(Long id, TipoAlojamiento tipo) {
        String sql = "UPDATE tipo_alojamiento SET nombre = ?, descripcion = ? WHERE id = ?";
        jdbcTemplate.update(sql, tipo.getNombre(), tipo.getDescripcion(), id);
    }

    public void delete(Long id) {
        String sql = "DELETE FROM tipo_alojamiento WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}
