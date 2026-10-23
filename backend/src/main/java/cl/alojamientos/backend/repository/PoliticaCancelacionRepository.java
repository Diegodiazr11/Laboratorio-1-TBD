package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.PoliticaCancelacion;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class PoliticaCancelacionRepository {

    private final JdbcTemplate jdbcTemplate;

    public PoliticaCancelacionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<PoliticaCancelacion> politicaRowMapper = (rs, rowNum) -> new PoliticaCancelacion(
            rs.getLong("id"),
            rs.getString("nombre"),
            rs.getString("descripcion")
    );

    public void save(PoliticaCancelacion politica) {
        String sql = "INSERT INTO politica_cancelacion (nombre, descripcion) VALUES (?, ?)";
        jdbcTemplate.update(sql, politica.getNombre(), politica.getDescripcion());
    }

    public List<PoliticaCancelacion> findAll() {
        String sql = "SELECT * FROM politica_cancelacion";
        return jdbcTemplate.query(sql, politicaRowMapper);
    }

    public Optional<PoliticaCancelacion> findById(Long id) {
        String sql = "SELECT * FROM politica_cancelacion WHERE id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, politicaRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void update(Long id, PoliticaCancelacion politica) {
        String sql = "UPDATE politica_cancelacion SET nombre = ?, descripcion = ? WHERE id = ?";
        jdbcTemplate.update(sql, politica.getNombre(), politica.getDescripcion(), id);
    }

    public void delete(Long id) {
        String sql = "DELETE FROM politica_cancelacion WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}