package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.Ciudad;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CiudadRepository {

    private final JdbcTemplate jdbcTemplate;

    public CiudadRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Ciudad> ciudadRowMapper = (rs, rowNum) ->
            new Ciudad(rs.getLong("id"), rs.getString("nombre"));

    public List<Ciudad> findAll() {
        return jdbcTemplate.query("SELECT * FROM ciudad ORDER BY nombre", ciudadRowMapper);
    }

    public Optional<Ciudad> findById(Long id) {
        return jdbcTemplate.query("SELECT * FROM ciudad WHERE id = ?", ciudadRowMapper, id)
                .stream().findFirst();
    }

    public Long save(String nombre) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO ciudad (nombre) VALUES (?) RETURNING id", Long.class, nombre);
    }

    public int update(Long id, String nombre) {
        return jdbcTemplate.update("UPDATE ciudad SET nombre = ? WHERE id = ?", nombre, id);
    }

    public int delete(Long id) {
        return jdbcTemplate.update("DELETE FROM ciudad WHERE id = ?", id);
    }
}
