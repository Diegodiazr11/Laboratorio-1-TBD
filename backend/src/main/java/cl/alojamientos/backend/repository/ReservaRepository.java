package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.Reserva;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

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
            rs.getString("estado")
    );

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

    public Long confirmarReserva(Long alojamientoId, Long huespedId, LocalDate checkin, LocalDate checkout, Integer numHuespedes) {
        String sql = "CALL public.sp_confirmar_reserva(?::integer, ?::integer, ?::date, ?::date, ?::integer, NULL)";
        return jdbcTemplate.queryForObject(sql, Long.class, alojamientoId, huespedId, checkin, checkout, numHuespedes);
    }

    public BigDecimal cancelarReserva(Long reservaId, Long huespedId) {
        String sql = "CALL public.sp_cancelar_reserva(?::integer, ?::integer, NULL)";
        return jdbcTemplate.queryForObject(sql, BigDecimal.class, reservaId, huespedId);
    }

    public int countAll() {
        Integer total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM reserva", Integer.class);
        return total != null ? total : 0;
    }

    public int completarReservasVencidas() {
        String sql = "UPDATE reserva SET estado = 'COMPLETADA' " +
                "WHERE estado = 'CONFIRMADA' AND fecha_checkout < CURRENT_DATE";
        return jdbcTemplate.update(sql);
    }
}
