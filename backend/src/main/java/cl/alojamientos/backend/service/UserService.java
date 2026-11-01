package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.UserResponseDTO;
import cl.alojamientos.backend.models.User;
import cl.alojamientos.backend.repository.UserRepository;
import cl.alojamientos.backend.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, JwtUtil jwtUtil){
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public List<UserResponseDTO> obtenerTodos() {
        return userRepository.findAll().stream().map(this::aDTO).toList();
    }

    public UserResponseDTO obtenerUserEmail(String email) {
        return userRepository.findByEmail(email)
                .map(this::aDTO)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontró un usuario con ese email"));
    }

    private UserResponseDTO aDTO(User u) {
        return new UserResponseDTO(u.getId(), u.getNombre(), u.getEmail(), u.getRol(), u.getEstado());
    }

    public int contarUsuarios() {
        return userRepository.countAll();
    }

    public void cambiarEstadoUsuario(Long id, String rawStatus) {
        String estadoBd = "ACTIVO".equalsIgnoreCase(rawStatus) ? "ACTIVO" : "INACTIVO";
        userRepository.updateEstado(id, estadoBd);
    }
}
