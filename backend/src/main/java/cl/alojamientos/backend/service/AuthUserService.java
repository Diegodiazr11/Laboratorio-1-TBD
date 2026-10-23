package cl.alojamientos.backend.service;

import cl.alojamientos.backend.dto.AuthResponseDTO;
import cl.alojamientos.backend.dto.LoginRequestDTO;
import cl.alojamientos.backend.dto.RegisterRequestDTO;
import cl.alojamientos.backend.models.User;
import cl.alojamientos.backend.repository.UserRepository;
import cl.alojamientos.backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthUserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponseDTO register(RegisterRequestDTO request){

        if(userRepository.findByEmail(request.getEmail()).isPresent()){
            throw new RuntimeException("El email ya esta registrado");
        }

        if(request.getPassword().length() < 8){
            throw new RuntimeException(("La contraseña debe tener al menos 8 caracteres"));
        }

        User nuevoUsuario = new User();
        nuevoUsuario.setNombre(request.getNombre());
        nuevoUsuario.setEmail(request.getEmail());
        nuevoUsuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        String rol = request.getRol() != null ? request.getRol().toUpperCase() : "HUESPED";
        nuevoUsuario.setRol(rol);

        userRepository.save(nuevoUsuario);

        User usuarioGuardado = userRepository.findByEmail(request.getEmail()).get();
        String token = jwtUtil.generateToken(usuarioGuardado.getId(), usuarioGuardado.getEmail(), usuarioGuardado.getRol());

        return new AuthResponseDTO(token, "Registro exitoso");
    }

    public AuthResponseDTO login(LoginRequestDTO loginRequest){
        User usuario = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> (new RuntimeException("Correo inválido")));

        if("INACTIVO".equals(usuario.getEstado())){
            throw new RuntimeException("La cuenta esta desactivada");
        }

        if(!passwordEncoder.matches(loginRequest.getPassword(), usuario.getPasswordHash())){
            throw new RuntimeException("Contraseña inválida");
        }

        String token = jwtUtil.generateToken(usuario.getId(), usuario.getEmail(), usuario.getRol());
        return new AuthResponseDTO(token, "Sesion iniciada con exito");
    }
}
