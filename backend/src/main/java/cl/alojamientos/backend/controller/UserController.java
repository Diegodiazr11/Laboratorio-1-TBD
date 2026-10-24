package cl.alojamientos.backend.controller;

import cl.alojamientos.backend.dto.UserResponseDTO;
import cl.alojamientos.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService){
        this.userService = userService;
    }

    @GetMapping("/todos")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<UserResponseDTO>> obtenerTodosUser(){
        return ResponseEntity.ok(userService.obtenerTodos());
    }

    @GetMapping("/{email}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<UserResponseDTO> obtenerUserEmail(@PathVariable String email){
        return ResponseEntity.ok(userService.obtenerUserEmail(email));
    }
}
