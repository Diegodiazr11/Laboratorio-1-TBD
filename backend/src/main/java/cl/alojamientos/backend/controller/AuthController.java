package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.AuthResponseDTO;
import cl.alojamientos.backend.dto.LoginRequestDTO;
import cl.alojamientos.backend.dto.RegisterRequestDTO;
import cl.alojamientos.backend.service.AuthUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthUserService authUserService;

    public AuthController(AuthUserService authUserService){
        this.authUserService = authUserService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request){
        try{
            AuthResponseDTO response = authUserService.register(request);
            return ResponseEntity.ok(response);
        } catch(RuntimeException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request){
        try{
            AuthResponseDTO response = authUserService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e){
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }
}
