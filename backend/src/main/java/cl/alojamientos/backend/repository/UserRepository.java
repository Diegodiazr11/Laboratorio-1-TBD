package cl.alojamientos.backend.repository;

import cl.alojamientos.backend.models.User;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate){
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<User> userRowMapper = new RowMapper<User>() {
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(rs.getLong("id"));
            user.setNombre(rs.getString("nombre"));
            user.setEmail(rs.getString("email"));
            user.setPasswordHash(rs.getString("password_hash"));
            user.setRol(rs.getString("rol"));
            user.setEstado(rs.getString("estado"));
            return user;
        }
    };

    public void save(User user){
        String sql = "INSERT INTO usuario (nombre, email, password_hash, rol, estado)" +
                     "VALUES (?,?,?,?,'ACTIVO')";
        jdbcTemplate.update(sql,
                user.getNombre(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRol()
        );
    }

    public Optional<User> findByEmail(String email){
        String sql = "SELECT * FROM usuario WHERE email = ?";
        try{
            User user = jdbcTemplate.queryForObject(sql, userRowMapper, email);
            return Optional.ofNullable(user);
        }catch(EmptyResultDataAccessException e){
            return Optional.empty();
        }
    }

    public List<User> findAll(){
        String sql = "SELECT * FROM usuario";
        return jdbcTemplate.query(sql, userRowMapper);
    }

    public int countAll() {
        Integer total = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM usuario", Integer.class);
        return total != null ? total : 0;
    }

    public int updateEstado(Long id, String estado) {
        String sql = "UPDATE usuario SET estado = ? WHERE id = ?";
        return jdbcTemplate.update(sql, estado, id);
    }
}
