package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.Reserva;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public class ReservaRepository {

    private final JdbcTemplate jdbcTemplate;

    public ReservaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Reserva> reservaRowMapper = (rs, rowNum) -> new Reserva(
            rs.getLong("id"),
            rs.getLong("alojamiento_id"),
            rs.getLong("huesped_id"),
            rs.getObject("fecha_checkin", LocalDate.class),
            rs.getObject("fecha_checkout", LocalDate.class),
            rs.getInt("num_huespedes"),
            rs.getBigDecimal("total"),
            rs.getString("estado"));

    public Optional<Reserva> findById(Long id) {
        return jdbcTemplate.query("SELECT * FROM reserva WHERE id = ?", reservaRowMapper, id)
                .stream().findFirst();
    }

    public Optional<Reserva> findByIdParaUsuario(Long id, Long usuarioId, boolean esAdmin) {
        String sql = "SELECT r.* FROM reserva r JOIN alojamiento a ON a.id = r.alojamiento_id " +
                "WHERE r.id = ? AND (? OR r.huesped_id = ? OR a.anfitrion_id = ?)";
        return jdbcTemplate.query(sql, reservaRowMapper, id, esAdmin, usuarioId, usuarioId)
                .stream().findFirst();
    }

    public List<Reserva> findByHuespedId(Long huespedId) {
        return jdbcTemplate.query(
                "SELECT * FROM reserva WHERE huesped_id = ? ORDER BY fecha_checkin DESC",
                reservaRowMapper, huespedId);
    }

    public List<Reserva> findByAnfitrionId(Long anfitrionId) {
        String sql = "SELECT r.* FROM reserva r JOIN alojamiento a ON a.id = r.alojamiento_id " +
                "WHERE a.anfitrion_id = ? ORDER BY r.fecha_checkin DESC";
        return jdbcTemplate.query(sql, reservaRowMapper, anfitrionId);
    }

    public List<Reserva> findAll() {
        return jdbcTemplate.query("SELECT * FROM reserva ORDER BY fecha_checkin DESC", reservaRowMapper);
    }
}
