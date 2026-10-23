package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.Alojamiento;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

@Repository
public class AlojamientoRepository {

    private final JdbcTemplate jdbcTemplate;

    public AlojamientoRepository(JdbcTemplate jdbcTemplate){
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Alojamiento> alojamientoRowMapper = new RowMapper<>() {
        @Override
        public Alojamiento mapRow(ResultSet rs, int rowNum) throws SQLException {
            Alojamiento alojamiento = new Alojamiento();
            alojamiento.setId(rs.getLong("id"));
            alojamiento.setAnfitrionId(rs.getLong("anfitrion_id"));
            alojamiento.setTipoId(rs.getLong("tipo_id"));
            alojamiento.setCiudadId(rs.getLong("ciudad_id"));
            alojamiento.setPoliticaId(rs.getLong("politica_id"));
            alojamiento.setTitulo(rs.getString("titulo"));
            alojamiento.setCapacidadMax(rs.getInt("capacidad_max"));
            alojamiento.setPrecioBaseNoche(rs.getBigDecimal("precio_base_noche"));
            alojamiento.setEstadiaMinima(rs.getInt("estadia_minima"));
            alojamiento.setEstadoPublicacion(rs.getString("estado_publicacion"));

            return alojamiento;
        }
    };

    public Long save(Alojamiento alojamiento){
        String sql = "INSERT INTO alojamiento (anfitrion_id, tipo_id, ciudad_id, politica_id, " +
                "titulo, capacidad_max, precio_base_noche, estadia_minima, estado_publicacion) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE') RETURNING id";

        return jdbcTemplate.queryForObject(sql, Long.class,
                alojamiento.getAnfitrionId(),
                alojamiento.getTipoId(),
                alojamiento.getCiudadId(),
                alojamiento.getPoliticaId(),
                alojamiento.getTitulo(),
                alojamiento.getCapacidadMax(),
                alojamiento.getPrecioBaseNoche(),
                alojamiento.getEstadiaMinima()
        );
    }

    public Optional<Alojamiento> findById(Long id) {
        String sql = "SELECT * FROM alojamiento WHERE id = ?";
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, alojamientoRowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Alojamiento> findByAnfitrionId(Long anfitrionId) {
        String sql = "SELECT * FROM alojamiento WHERE anfitrion_id = ?";
        return jdbcTemplate.query(sql, alojamientoRowMapper, anfitrionId);
    }

    public int update(Alojamiento alojamiento) {
        String sql = "UPDATE alojamiento SET tipo_id = ?, ciudad_id = ?, politica_id = ?, titulo = ?, " +
                "capacidad_max = ?, precio_base_noche = ?, estadia_minima = ? " +
                "WHERE id = ? AND anfitrion_id = ?";

        return jdbcTemplate.update(sql,
                alojamiento.getTipoId(),
                alojamiento.getCiudadId(),
                alojamiento.getPoliticaId(),
                alojamiento.getTitulo(),
                alojamiento.getCapacidadMax(),
                alojamiento.getPrecioBaseNoche(),
                alojamiento.getEstadiaMinima(),
                alojamiento.getId(),
                alojamiento.getAnfitrionId()
        );
    }

    public int delete(Long id, Long anfitrionId) {
        String sql = "UPDATE alojamiento SET estado_publicacion = 'SUSPENDIDO' " +
                "WHERE id = ? AND anfitrion_id = ?";
        return jdbcTemplate.update(sql, id, anfitrionId);
    }

    public List<Alojamiento> searchAvailable(Long ciudadId, LocalDate checkin, LocalDate checkout, Integer huespedes) {
        String sql = """
        SELECT *
        FROM alojamiento
        WHERE alojamiento.ciudad_id = ?
          AND alojamiento.estado_publicacion = 'PUBLICADO'
          AND alojamiento.capacidad_max >= ?
          AND (?::date - ?::date) >= alojamiento.estadia_minima
          AND public.fn_alojamiento_disponible(alojamiento.id, ?::date, ?::date)
        ORDER BY alojamiento.precio_base_noche ASC
    """;
        return jdbcTemplate.query(sql, alojamientoRowMapper, ciudadId, huespedes, checkout, checkin, checkin, checkout);
    }

    public int changePostState(Long id, String estado) {
        String sql = "UPDATE alojamiento SET estado_publicacion = ? WHERE id = ?";
        return jdbcTemplate.update(sql, estado, id);
    }

}

