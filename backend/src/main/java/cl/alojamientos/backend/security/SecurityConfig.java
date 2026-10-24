package cl.alojamientos.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers("/api/auth/**").permitAll() // Registro y Login
                        .requestMatchers(HttpMethod.GET, "/api/alojamientos/buscar").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/alojamientos/*/resenas").permitAll()
                        .requestMatchers(HttpMethod.GET,"/api/alojamientos/todos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/alojamientos").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/resenas/alojamientos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ciudades/**", "/api/tipos-alojamiento/**", "/api/politicas-cancelacion/**").permitAll()

                        .requestMatchers("/api/reservas/mias/**").hasRole("HUESPED")
                        .requestMatchers(HttpMethod.POST, "/api/reservas/**").hasRole("HUESPED")
                        .requestMatchers("/api/reservas/mis-alojamientos/**").hasRole("ANFITRION")
                        .requestMatchers(HttpMethod.GET, "/api/reservas/*").hasAnyRole("HUESPED", "ANFITRION", "ADMINISTRADOR")

                        .requestMatchers(HttpMethod.GET, "/api/resenas/misresenas").hasRole("HUESPED")
                        .requestMatchers(HttpMethod.POST, "/api/resenas/**").hasRole("HUESPED")
                        .requestMatchers(HttpMethod.DELETE, "/api/resenas/**").hasRole("HUESPED")

                        .requestMatchers(HttpMethod.GET, "/api/alojamientos/mis-publicaciones").hasRole("ANFITRION")
                        .requestMatchers(HttpMethod.POST, "/api/alojamientos/**").hasRole("ANFITRION")
                        .requestMatchers(HttpMethod.PUT, "/api/alojamientos/**").hasRole("ANFITRION")
                        .requestMatchers(HttpMethod.DELETE, "/api/alojamientos/**").hasRole("ANFITRION")
                        .requestMatchers("/api/temporadas/**").hasRole("ANFITRION")

                        .requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/resenas/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/reservas/admin/**").hasRole("ADMINISTRADOR")
                        .requestMatchers("/api/ciudades/**", "/api/tipos-alojamiento/**").hasRole("ADMINISTRADOR")

                        .requestMatchers("/api/alojamientos/*/tarifas/**").hasRole("ANFITRION")

                        .requestMatchers(HttpMethod.POST, "/api/pago").hasRole("HUESPED")

                        .requestMatchers(HttpMethod.GET, "/api/alojamientos/*/calendario").permitAll()
                        .requestMatchers("/api/alojamientos/*/calendario/**").hasRole("ANFITRION")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**",configuration);

        return source;
    }
}