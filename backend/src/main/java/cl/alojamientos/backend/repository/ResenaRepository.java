package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.Resena;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class ResenaRepository {

    private final JdbcTemplate jdbcTemplate;

    public ResenaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Resena> resenaRowMapper = (rs, rowNum) -> new Resena(
            rs.getLong("id"),
            rs.getLong("reserva_id"),
            rs.getInt("calificacion"),
            rs.getString("comentario"),
            rs.getString("estado"),
            rs.getObject("fecha", OffsetDateTime.class));

    public Optional<Resena> findById(Long id) {
        return jdbcTemplate.query("SELECT * FROM resena WHERE id = ?", resenaRowMapper, id)
                .stream().findFirst();
    }

    public List<Resena> findByAlojamientoId(Long alojamientoId) {
        String sql = "SELECT r.* FROM resena r JOIN reserva rv ON rv.id = r.reserva_id " +
                "WHERE rv.alojamiento_id = ? AND r.estado = 'VISIBLE' ORDER BY r.fecha DESC";
        return jdbcTemplate.query(sql, resenaRowMapper, alojamientoId);
    }

    public List<Resena> findByHuespedId(Long huespedId) {
        String sql = "SELECT r.* FROM resena r JOIN reserva rv ON rv.id = r.reserva_id " +
                "WHERE rv.huesped_id = ? ORDER BY r.fecha DESC";
        return jdbcTemplate.query(sql, resenaRowMapper, huespedId);
    }

    /**
     * Inserta solo si la reserva es del huésped Y está COMPLETADA.
     * Vacío = la reserva no existe, no es suya o no está completada.
     */
    public Optional<Long> save(Long reservaId, Long huespedId, Integer calificacion, String comentario) {
        String sql = "INSERT INTO resena (reserva_id, calificacion, comentario) " +
                "SELECT id, CAST(? AS smallint), CAST(? AS text) FROM reserva " +
                "WHERE id = ? AND huesped_id = ? AND estado = 'COMPLETADA' RETURNING id";
        return jdbcTemplate.query(sql, (rs, i) -> rs.getLong("id"),
                calificacion, comentario, reservaId, huespedId).stream().findFirst();
    }

    public int delete(Long id, Long huespedId) {
        String sql = "DELETE FROM resena r USING reserva rv " +
                "WHERE r.id = ? AND rv.id = r.reserva_id AND rv.huesped_id = ?";
        return jdbcTemplate.update(sql, id, huespedId);
    }

    public int cambiarEstado(Long id, String estado) {
        return jdbcTemplate.update("UPDATE resena SET estado = ? WHERE id = ?", estado, id);
    }
}
