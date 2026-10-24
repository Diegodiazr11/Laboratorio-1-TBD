--
-- PostgreSQL database dump
--


-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-10-21 00:08:58

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.temporada DROP CONSTRAINT IF EXISTS temporada_alojamiento_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reserva DROP CONSTRAINT IF EXISTS reserva_huesped_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reserva DROP CONSTRAINT IF EXISTS reserva_alojamiento_id_fkey;
ALTER TABLE IF EXISTS ONLY public.resena DROP CONSTRAINT IF EXISTS resena_reserva_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pago DROP CONSTRAINT IF EXISTS pago_reserva_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bloqueo_calendario DROP CONSTRAINT IF EXISTS bloqueo_calendario_reserva_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bloqueo_calendario DROP CONSTRAINT IF EXISTS bloqueo_calendario_alojamiento_id_fkey;
ALTER TABLE IF EXISTS ONLY public.alojamiento DROP CONSTRAINT IF EXISTS alojamiento_tipo_id_fkey;
ALTER TABLE IF EXISTS ONLY public.alojamiento DROP CONSTRAINT IF EXISTS alojamiento_politica_id_fkey;
ALTER TABLE IF EXISTS ONLY public.alojamiento DROP CONSTRAINT IF EXISTS alojamiento_ciudad_id_fkey;
ALTER TABLE IF EXISTS ONLY public.alojamiento DROP CONSTRAINT IF EXISTS alojamiento_anfitrion_id_fkey;
DROP INDEX IF EXISTS public.idx_reserva_rango_fechas;
DROP INDEX IF EXISTS public.idx_reserva_alojamiento;
DROP INDEX IF EXISTS public.idx_alojamiento_ciudad;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_pkey;
ALTER TABLE IF EXISTS ONLY public.usuario DROP CONSTRAINT IF EXISTS usuario_email_key;
ALTER TABLE IF EXISTS ONLY public.tipo_alojamiento DROP CONSTRAINT IF EXISTS tipo_alojamiento_pkey;
ALTER TABLE IF EXISTS ONLY public.tipo_alojamiento DROP CONSTRAINT IF EXISTS tipo_alojamiento_nombre_key;
ALTER TABLE IF EXISTS ONLY public.temporada DROP CONSTRAINT IF EXISTS temporada_pkey;
ALTER TABLE IF EXISTS ONLY public.temporada DROP CONSTRAINT IF EXISTS temporada_alojamiento_id_daterange_excl;
ALTER TABLE IF EXISTS ONLY public.reserva DROP CONSTRAINT IF EXISTS reserva_pkey;
ALTER TABLE IF EXISTS ONLY public.resena DROP CONSTRAINT IF EXISTS resena_reserva_id_key;
ALTER TABLE IF EXISTS ONLY public.resena DROP CONSTRAINT IF EXISTS resena_pkey;
ALTER TABLE IF EXISTS ONLY public.politica_cancelacion DROP CONSTRAINT IF EXISTS politica_cancelacion_pkey;
ALTER TABLE IF EXISTS ONLY public.politica_cancelacion DROP CONSTRAINT IF EXISTS politica_cancelacion_nombre_key;
ALTER TABLE IF EXISTS ONLY public.pago DROP CONSTRAINT IF EXISTS pago_pkey;
ALTER TABLE IF EXISTS ONLY public.ciudad DROP CONSTRAINT IF EXISTS ciudad_pkey;
ALTER TABLE IF EXISTS ONLY public.ciudad DROP CONSTRAINT IF EXISTS ciudad_nombre_key;
ALTER TABLE IF EXISTS ONLY public.bloqueo_calendario DROP CONSTRAINT IF EXISTS bloqueo_calendario_pkey;
ALTER TABLE IF EXISTS ONLY public.alojamiento DROP CONSTRAINT IF EXISTS alojamiento_pkey;
DROP TABLE IF EXISTS public.usuario;
DROP TABLE IF EXISTS public.tipo_alojamiento;
DROP TABLE IF EXISTS public.temporada;
DROP TABLE IF EXISTS public.reserva;
DROP TABLE IF EXISTS public.resena;
DROP TABLE IF EXISTS public.politica_cancelacion;
DROP TABLE IF EXISTS public.pago;
DROP TABLE IF EXISTS public.ciudad;
DROP TABLE IF EXISTS public.bloqueo_calendario;
DROP TABLE IF EXISTS public.alojamiento;
DROP FUNCTION IF EXISTS public.fn_precio_noche(p_alojamiento_id integer, p_fecha date);
DROP FUNCTION IF EXISTS public.fn_porcentaje_reembolso(p_reserva_id integer, p_fecha_cancelacion date);
DROP FUNCTION IF EXISTS public.fn_calcular_total(p_alojamiento_id integer, p_checkin date, p_checkout date);
DROP FUNCTION IF EXISTS public.fn_alojamiento_disponible(p_alojamiento_id integer, p_checkin date, p_checkout date);
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS btree_gist;
--
-- TOC entry 2 (class 3079 OID 21349)
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- TOC entry 5477 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- TOC entry 3 (class 3079 OID 22075)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5478 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 350 (class 1255 OID 22330)
-- Name: fn_alojamiento_disponible(integer, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_alojamiento_disponible(p_alojamiento_id integer, p_checkin date, p_checkout date) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    SELECT NOT EXISTS (
        SELECT 1 FROM reserva r
         WHERE r.alojamiento_id = p_alojamiento_id
           AND r.estado = 'CONFIRMADA'
           AND r.rango_fechas && daterange(p_checkin, p_checkout, '[)'));
$$;


--
-- TOC entry 358 (class 1255 OID 22329)
-- Name: fn_calcular_total(integer, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_calcular_total(p_alojamiento_id integer, p_checkin date, p_checkout date) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
    SELECT COALESCE(SUM(fn_precio_noche(p_alojamiento_id, p_checkin + g)), 0)
      FROM generate_series(0, p_checkout - p_checkin - 1) AS g;
$$;


--
-- TOC entry 495 (class 1255 OID 22331)
-- Name: fn_porcentaje_reembolso(integer, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_porcentaje_reembolso(p_reserva_id integer, p_fecha_cancelacion date DEFAULT CURRENT_DATE) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
    SELECT CASE
             WHEN (r.fecha_checkin - p_fecha_cancelacion) >= p.dias_antelacion_total   THEN 100
             WHEN (r.fecha_checkin - p_fecha_cancelacion) >= p.dias_antelacion_parcial THEN p.pct_reembolso_parcial
             ELSE 0
           END
      FROM reserva r
      JOIN alojamiento a          ON a.id = r.alojamiento_id
      JOIN politica_cancelacion p ON p.id = a.politica_id
     WHERE r.id = p_reserva_id;
$$;


--
-- TOC entry 301 (class 1255 OID 22328)
-- Name: fn_precio_noche(integer, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_precio_noche(p_alojamiento_id integer, p_fecha date) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
    SELECT COALESCE(
        (SELECT t.precio_noche FROM temporada t
          WHERE t.alojamiento_id = p_alojamiento_id
            AND p_fecha BETWEEN t.fecha_inicio AND t.fecha_fin),
        (SELECT a.precio_base_noche FROM alojamiento a WHERE a.id = p_alojamiento_id)
    );
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 22171)
-- Name: alojamiento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alojamiento (
    id integer NOT NULL,
    anfitrion_id integer NOT NULL,
    tipo_id smallint NOT NULL,
    ciudad_id integer NOT NULL,
    politica_id smallint NOT NULL,
    titulo character varying(150) NOT NULL,
    capacidad_max integer NOT NULL,
    precio_base_noche numeric(10,2) NOT NULL,
    estadia_minima integer DEFAULT 1 NOT NULL,
    estado_publicacion character varying(12) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    CONSTRAINT alojamiento_capacidad_max_check CHECK ((capacidad_max > 0)),
    CONSTRAINT alojamiento_estadia_minima_check CHECK ((estadia_minima >= 1)),
    CONSTRAINT alojamiento_estado_publicacion_check CHECK (((estado_publicacion)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'PUBLICADO'::character varying, 'SUSPENDIDO'::character varying])::text[]))),
    CONSTRAINT alojamiento_precio_base_noche_check CHECK ((precio_base_noche > (0)::numeric))
);


--
-- TOC entry 229 (class 1259 OID 22170)
-- Name: alojamiento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.alojamiento ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.alojamiento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 235 (class 1259 OID 22264)
-- Name: bloqueo_calendario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bloqueo_calendario (
    alojamiento_id integer NOT NULL,
    fecha date NOT NULL,
    reserva_id integer NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 22133)
-- Name: ciudad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ciudad (
    id integer NOT NULL,
    nombre character varying(80) NOT NULL
);


--
-- TOC entry 223 (class 1259 OID 22132)
-- Name: ciudad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ciudad ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ciudad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 237 (class 1259 OID 22283)
-- Name: pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pago (
    id integer NOT NULL,
    reserva_id integer NOT NULL,
    tipo character varying(10) NOT NULL,
    monto numeric(12,2) NOT NULL,
    fecha_pago timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pago_monto_check CHECK ((monto > (0)::numeric)),
    CONSTRAINT pago_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['PAGO'::character varying, 'REEMBOLSO'::character varying])::text[])))
);


--
-- TOC entry 236 (class 1259 OID 22282)
-- Name: pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pago ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 228 (class 1259 OID 22153)
-- Name: politica_cancelacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.politica_cancelacion (
    id smallint NOT NULL,
    nombre character varying(20) NOT NULL,
    dias_antelacion_total integer NOT NULL,
    dias_antelacion_parcial integer NOT NULL,
    pct_reembolso_parcial numeric(5,2) NOT NULL,
    CONSTRAINT politica_cancelacion_check CHECK ((dias_antelacion_total >= dias_antelacion_parcial)),
    CONSTRAINT politica_cancelacion_dias_antelacion_parcial_check CHECK ((dias_antelacion_parcial >= 0)),
    CONSTRAINT politica_cancelacion_dias_antelacion_total_check CHECK ((dias_antelacion_total >= 0)),
    CONSTRAINT politica_cancelacion_nombre_check CHECK (((nombre)::text = ANY ((ARRAY['FLEXIBLE'::character varying, 'MODERADA'::character varying, 'ESTRICTA'::character varying])::text[]))),
    CONSTRAINT politica_cancelacion_pct_reembolso_parcial_check CHECK (((pct_reembolso_parcial >= (0)::numeric) AND (pct_reembolso_parcial <= (100)::numeric)))
);


--
-- TOC entry 227 (class 1259 OID 22152)
-- Name: politica_cancelacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.politica_cancelacion ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.politica_cancelacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 239 (class 1259 OID 22302)
-- Name: resena; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resena (
    id integer NOT NULL,
    reserva_id integer NOT NULL,
    calificacion smallint NOT NULL,
    comentario text,
    estado character varying(10) DEFAULT 'VISIBLE'::character varying NOT NULL,
    fecha timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT resena_calificacion_check CHECK (((calificacion >= 1) AND (calificacion <= 5))),
    CONSTRAINT resena_estado_check CHECK (((estado)::text = ANY ((ARRAY['VISIBLE'::character varying, 'OCULTA'::character varying])::text[])))
);


--
-- TOC entry 238 (class 1259 OID 22301)
-- Name: resena_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.resena ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.resena_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 234 (class 1259 OID 22233)
-- Name: reserva; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserva (
    id integer NOT NULL,
    alojamiento_id integer NOT NULL,
    huesped_id integer NOT NULL,
    fecha_checkin date NOT NULL,
    fecha_checkout date NOT NULL,
    num_huespedes integer NOT NULL,
    total numeric(12,2) NOT NULL,
    estado character varying(12) DEFAULT 'PENDIENTE'::character varying NOT NULL,
    rango_fechas daterange GENERATED ALWAYS AS (daterange(fecha_checkin, fecha_checkout, '[)'::text)) STORED,
    CONSTRAINT reserva_check CHECK ((fecha_checkout > fecha_checkin)),
    CONSTRAINT reserva_estado_check CHECK (((estado)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'CONFIRMADA'::character varying, 'CANCELADA'::character varying, 'COMPLETADA'::character varying])::text[]))),
    CONSTRAINT reserva_num_huespedes_check CHECK ((num_huespedes > 0)),
    CONSTRAINT reserva_total_check CHECK ((total >= (0)::numeric))
);


--
-- TOC entry 233 (class 1259 OID 22232)
-- Name: reserva_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reserva ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.reserva_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 232 (class 1259 OID 22213)
-- Name: temporada; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temporada (
    id integer NOT NULL,
    alojamiento_id integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    precio_noche numeric(10,2) NOT NULL,
    CONSTRAINT temporada_check CHECK ((fecha_fin >= fecha_inicio)),
    CONSTRAINT temporada_precio_noche_check CHECK ((precio_noche > (0)::numeric))
);


--
-- TOC entry 231 (class 1259 OID 22212)
-- Name: temporada_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.temporada ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.temporada_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 226 (class 1259 OID 22143)
-- Name: tipo_alojamiento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_alojamiento (
    id smallint NOT NULL,
    nombre character varying(40) NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 22142)
-- Name: tipo_alojamiento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tipo_alojamiento ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tipo_alojamiento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 222 (class 1259 OID 22114)
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    rol character varying(15) NOT NULL,
    nombre character varying(120) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    estado character varying(10) DEFAULT 'ACTIVO'::character varying NOT NULL,
    CONSTRAINT usuario_estado_check CHECK (((estado)::text = ANY ((ARRAY['ACTIVO'::character varying, 'INACTIVO'::character varying])::text[]))),
    CONSTRAINT usuario_rol_check CHECK (((rol)::text = ANY ((ARRAY['HUESPED'::character varying, 'ANFITRION'::character varying, 'ADMINISTRADOR'::character varying])::text[])))
);


--
-- TOC entry 221 (class 1259 OID 22113)
-- Name: usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuario ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 5462 (class 0 OID 22171)
-- Dependencies: 230
-- Data for Name: alojamiento; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.alojamiento VALUES (1, 2, 1, 1, 1, 'Depto moderno en Providencia', 4, 45000.00, 1, 'PUBLICADO');
INSERT INTO public.alojamiento VALUES (2, 2, 1, 2, 2, 'Depto con vista al mar, Cerro Alegre', 3, 38000.00, 2, 'PUBLICADO');
INSERT INTO public.alojamiento VALUES (3, 2, 3, 3, 3, 'Casa familiar cerca de la playa', 8, 95000.00, 3, 'PUBLICADO');
INSERT INTO public.alojamiento VALUES (4, 3, 2, 4, 2, 'Cabaña con tinaja frente al lago', 6, 70000.00, 2, 'PUBLICADO');
INSERT INTO public.alojamiento VALUES (5, 3, 2, 5, 2, 'Cabaña con vista al volcán Osorno', 5, 65000.00, 2, 'PUBLICADO');
INSERT INTO public.alojamiento VALUES (6, 3, 3, 6, 3, 'Casa con piscina en La Serena', 10, 110000.00, 3, 'PUBLICADO');
INSERT INTO public.alojamiento VALUES (7, 4, 2, 7, 1, 'Cabaña de adobe en San Pedro', 4, 55000.00, 2, 'PUBLICADO');
INSERT INTO public.alojamiento VALUES (8, 4, 1, 1, 1, 'Loft en Barrio Italia', 2, 32000.00, 1, 'PENDIENTE');


--
-- TOC entry 5467 (class 0 OID 22264)
-- Dependencies: 235
-- Data for Name: bloqueo_calendario; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.bloqueo_calendario VALUES (1, '2026-09-11', 1);
INSERT INTO public.bloqueo_calendario VALUES (1, '2026-09-12', 1);
INSERT INTO public.bloqueo_calendario VALUES (1, '2026-09-13', 1);
INSERT INTO public.bloqueo_calendario VALUES (2, '2026-09-21', 2);
INSERT INTO public.bloqueo_calendario VALUES (2, '2026-09-22', 2);
INSERT INTO public.bloqueo_calendario VALUES (2, '2026-09-23', 2);
INSERT INTO public.bloqueo_calendario VALUES (4, '2026-08-22', 3);
INSERT INTO public.bloqueo_calendario VALUES (4, '2026-08-23', 3);
INSERT INTO public.bloqueo_calendario VALUES (4, '2026-08-24', 3);
INSERT INTO public.bloqueo_calendario VALUES (4, '2026-08-25', 3);
INSERT INTO public.bloqueo_calendario VALUES (5, '2026-09-26', 4);
INSERT INTO public.bloqueo_calendario VALUES (5, '2026-09-27', 4);
INSERT INTO public.bloqueo_calendario VALUES (5, '2026-09-28', 4);
INSERT INTO public.bloqueo_calendario VALUES (3, '2026-10-01', 5);
INSERT INTO public.bloqueo_calendario VALUES (3, '2026-10-02', 5);
INSERT INTO public.bloqueo_calendario VALUES (3, '2026-10-03', 5);
INSERT INTO public.bloqueo_calendario VALUES (3, '2026-10-04', 5);
INSERT INTO public.bloqueo_calendario VALUES (1, '2026-10-06', 6);
INSERT INTO public.bloqueo_calendario VALUES (1, '2026-10-07', 6);
INSERT INTO public.bloqueo_calendario VALUES (4, '2026-10-31', 7);
INSERT INTO public.bloqueo_calendario VALUES (4, '2026-11-01', 7);
INSERT INTO public.bloqueo_calendario VALUES (4, '2026-11-02', 7);
INSERT INTO public.bloqueo_calendario VALUES (6, '2026-12-26', 8);
INSERT INTO public.bloqueo_calendario VALUES (6, '2026-12-27', 8);
INSERT INTO public.bloqueo_calendario VALUES (6, '2026-12-28', 8);
INSERT INTO public.bloqueo_calendario VALUES (6, '2026-12-29', 8);
INSERT INTO public.bloqueo_calendario VALUES (6, '2026-12-30', 8);
INSERT INTO public.bloqueo_calendario VALUES (6, '2026-12-31', 8);
INSERT INTO public.bloqueo_calendario VALUES (6, '2027-01-01', 8);
INSERT INTO public.bloqueo_calendario VALUES (3, '2026-11-10', 9);
INSERT INTO public.bloqueo_calendario VALUES (3, '2026-11-11', 9);
INSERT INTO public.bloqueo_calendario VALUES (3, '2026-11-12', 9);
INSERT INTO public.bloqueo_calendario VALUES (7, '2026-10-26', 10);
INSERT INTO public.bloqueo_calendario VALUES (7, '2026-10-27', 10);


--
-- TOC entry 5456 (class 0 OID 22133)
-- Dependencies: 224
-- Data for Name: ciudad; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.ciudad VALUES (1, 'Santiago');
INSERT INTO public.ciudad VALUES (2, 'Valparaíso');
INSERT INTO public.ciudad VALUES (3, 'Viña del Mar');
INSERT INTO public.ciudad VALUES (4, 'Pucón');
INSERT INTO public.ciudad VALUES (5, 'Puerto Varas');
INSERT INTO public.ciudad VALUES (6, 'La Serena');
INSERT INTO public.ciudad VALUES (7, 'San Pedro de Atacama');


--
-- TOC entry 5469 (class 0 OID 22283)
-- Dependencies: 237
-- Data for Name: pago; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.pago VALUES (1, 1, 'PAGO', 135000.00, '2026-08-27 00:00:00-04');
INSERT INTO public.pago VALUES (2, 2, 'PAGO', 114000.00, '2026-09-06 01:00:00-03');
INSERT INTO public.pago VALUES (3, 3, 'PAGO', 280000.00, '2026-08-07 00:00:00-04');
INSERT INTO public.pago VALUES (4, 4, 'PAGO', 195000.00, '2026-09-11 00:00:00-03');
INSERT INTO public.pago VALUES (5, 5, 'PAGO', 380000.00, '2026-09-16 00:00:00-03');
INSERT INTO public.pago VALUES (6, 6, 'PAGO', 90000.00, '2026-09-21 00:00:00-03');
INSERT INTO public.pago VALUES (7, 7, 'PAGO', 210000.00, '2026-10-06 00:03:57.998802-03');
INSERT INTO public.pago VALUES (8, 8, 'PAGO', 1050000.00, '2026-10-06 00:03:57.998802-03');
INSERT INTO public.pago VALUES (9, 9, 'PAGO', 285000.00, '2026-10-06 00:03:57.998802-03');
INSERT INTO public.pago VALUES (10, 10, 'PAGO', 110000.00, '2026-10-06 00:03:57.998802-03');
INSERT INTO public.pago VALUES (11, 11, 'PAGO', 195000.00, '2026-10-06 00:03:57.998802-03');
INSERT INTO public.pago VALUES (12, 12, 'PAGO', 330000.00, '2026-10-06 00:03:57.998802-03');
INSERT INTO public.pago VALUES (13, 11, 'REEMBOLSO', 195000.00, '2026-10-19 00:03:57.998802-03');
INSERT INTO public.pago VALUES (14, 12, 'REEMBOLSO', 165000.00, '2026-10-20 00:03:57.998802-03');


--
-- TOC entry 5460 (class 0 OID 22153)
-- Dependencies: 228
-- Data for Name: politica_cancelacion; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.politica_cancelacion VALUES (1, 'FLEXIBLE', 1, 0, 50.00);
INSERT INTO public.politica_cancelacion VALUES (2, 'MODERADA', 5, 1, 50.00);
INSERT INTO public.politica_cancelacion VALUES (3, 'ESTRICTA', 14, 7, 50.00);


--
-- TOC entry 5471 (class 0 OID 22302)
-- Dependencies: 239
-- Data for Name: resena; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.resena VALUES (1, 1, 5, 'Excelente ubicación y muy limpio. Volveríamos sin dudar.', 'VISIBLE', '2026-10-21 00:03:57.998802-03');
INSERT INTO public.resena VALUES (2, 2, 4, 'Linda vista, el departamento es pequeño pero acogedor.', 'VISIBLE', '2026-10-21 00:03:57.998802-03');
INSERT INTO public.resena VALUES (3, 3, 5, 'La tinaja fue lo mejor. Anfitrión muy atento.', 'VISIBLE', '2026-10-21 00:03:57.998802-03');
INSERT INTO public.resena VALUES (4, 4, 3, 'Bonita cabaña, pero faltaban algunos utensilios de cocina.', 'VISIBLE', '2026-10-21 00:03:57.998802-03');
INSERT INTO public.resena VALUES (5, 5, 4, 'Casa amplia, perfecta para la familia. Buen quincho.', 'VISIBLE', '2026-10-21 00:03:57.998802-03');


--
-- TOC entry 5466 (class 0 OID 22233)
-- Dependencies: 234
-- Data for Name: reserva; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.reserva VALUES (1, 1, 5, '2026-09-11', '2026-09-14', 2, 135000.00, 'COMPLETADA', DEFAULT);
INSERT INTO public.reserva VALUES (2, 2, 6, '2026-09-21', '2026-09-24', 2, 114000.00, 'COMPLETADA', DEFAULT);
INSERT INTO public.reserva VALUES (3, 4, 7, '2026-08-22', '2026-08-26', 4, 280000.00, 'COMPLETADA', DEFAULT);
INSERT INTO public.reserva VALUES (4, 5, 8, '2026-09-26', '2026-09-29', 3, 195000.00, 'COMPLETADA', DEFAULT);
INSERT INTO public.reserva VALUES (5, 3, 9, '2026-10-01', '2026-10-05', 6, 380000.00, 'COMPLETADA', DEFAULT);
INSERT INTO public.reserva VALUES (6, 1, 6, '2026-10-06', '2026-10-08', 2, 90000.00, 'COMPLETADA', DEFAULT);
INSERT INTO public.reserva VALUES (7, 4, 5, '2026-10-31', '2026-11-03', 4, 210000.00, 'CONFIRMADA', DEFAULT);
INSERT INTO public.reserva VALUES (8, 6, 7, '2026-12-26', '2027-01-02', 8, 1050000.00, 'CONFIRMADA', DEFAULT);
INSERT INTO public.reserva VALUES (9, 3, 8, '2026-11-10', '2026-11-13', 5, 285000.00, 'CONFIRMADA', DEFAULT);
INSERT INTO public.reserva VALUES (10, 7, 9, '2026-10-26', '2026-10-28', 2, 110000.00, 'CONFIRMADA', DEFAULT);
INSERT INTO public.reserva VALUES (11, 5, 5, '2026-11-05', '2026-11-08', 3, 195000.00, 'CANCELADA', DEFAULT);
INSERT INTO public.reserva VALUES (12, 6, 8, '2026-10-30', '2026-11-02', 6, 330000.00, 'CANCELADA', DEFAULT);
INSERT INTO public.reserva VALUES (13, 1, 7, '2026-11-30', '2026-12-02', 2, 90000.00, 'PENDIENTE', DEFAULT);


--
-- TOC entry 5464 (class 0 OID 22213)
-- Dependencies: 232
-- Data for Name: temporada; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.temporada VALUES (1, 3, '2026-12-15', '2027-03-15', 130000.00);
INSERT INTO public.temporada VALUES (2, 4, '2026-12-15', '2027-03-15', 95000.00);
INSERT INTO public.temporada VALUES (3, 4, '2027-07-01', '2027-07-31', 110000.00);
INSERT INTO public.temporada VALUES (4, 5, '2026-12-15', '2027-03-15', 90000.00);
INSERT INTO public.temporada VALUES (5, 6, '2026-12-15', '2027-03-15', 150000.00);
INSERT INTO public.temporada VALUES (6, 7, '2026-12-15', '2027-03-15', 70000.00);


--
-- TOC entry 5458 (class 0 OID 22143)
-- Dependencies: 226
-- Data for Name: tipo_alojamiento; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tipo_alojamiento VALUES (1, 'Departamento');
INSERT INTO public.tipo_alojamiento VALUES (2, 'Cabaña');
INSERT INTO public.tipo_alojamiento VALUES (3, 'Casa');


--
-- TOC entry 5454 (class 0 OID 22114)
-- Dependencies: 222
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.usuario VALUES (1, 'ADMINISTRADOR', 'Admin Plataforma', 'admin@alojamientos.cl', '$2a$06$eJx2wgr8GQT7Rk17znKuee0MzEv1NiIpDgT/2dThkTRuswibu6/yS', 'ACTIVO');
INSERT INTO public.usuario VALUES (2, 'ANFITRION', 'Carolina Muñoz', 'carolina@anfitrion.cl', '$2a$06$AsjWyuKDuDu3ty6D4VM2eOFoRF7StjI8O.D8mcx5E3LDIAdsED4Pi', 'ACTIVO');
INSERT INTO public.usuario VALUES (3, 'ANFITRION', 'Rodrigo Fuentes', 'rodrigo@anfitrion.cl', '$2a$06$fdiCS.st6CVJ5WOv5Y6fk.3wmPznP99oJauGtBXKjtjGnsUqXDLx2', 'ACTIVO');
INSERT INTO public.usuario VALUES (4, 'ANFITRION', 'Valentina Soto', 'valentina@anfitrion.cl', '$2a$06$Z3Qdz9e13sU0EOb0zynFRuuK2TENdWkOi/VtP7RJwRUFQfQcOedVa', 'ACTIVO');
INSERT INTO public.usuario VALUES (5, 'HUESPED', 'Matías Rojas', 'matias@huesped.cl', '$2a$06$IyX/VTtoHrXBRb2.DjDP0OxbVMDcneJkfqASsPktwJTJMe4jP81Py', 'ACTIVO');
INSERT INTO public.usuario VALUES (6, 'HUESPED', 'Camila Pérez', 'camila@huesped.cl', '$2a$06$PWtc9YzKCC5abYCHoARee.fPu6FHuv/Ixrvm.0LTQix9OcK.KxTMW', 'ACTIVO');
INSERT INTO public.usuario VALUES (7, 'HUESPED', 'Diego Araya', 'diego@huesped.cl', '$2a$06$MhvTLIA3i6Cjf3rXVqOeAuhewwht2PwBfOQOI/oYSm4hFTxEhXPlK', 'ACTIVO');
INSERT INTO public.usuario VALUES (8, 'HUESPED', 'Francisca Vidal', 'francisca@huesped.cl', '$2a$06$z2/hQ4UkoUMNl4dhYwnQ9.7f0nwE1C6ATPKBI0JDpPvfZUxtK90vi', 'ACTIVO');
INSERT INTO public.usuario VALUES (9, 'HUESPED', 'Sebastián Contreras', 'sebastian@huesped.cl', '$2a$06$G2FH7p1hS3X6jaDBhB1SbOyF0yuABwdh0f8ptKAvsr5xPVpE8/6J.', 'ACTIVO');


--
-- TOC entry 5479 (class 0 OID 0)
-- Dependencies: 229
-- Name: alojamiento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alojamiento_id_seq', 8, true);


--
-- TOC entry 5480 (class 0 OID 0)
-- Dependencies: 223
-- Name: ciudad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ciudad_id_seq', 7, true);


--
-- TOC entry 5481 (class 0 OID 0)
-- Dependencies: 236
-- Name: pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pago_id_seq', 14, true);


--
-- TOC entry 5482 (class 0 OID 0)
-- Dependencies: 227
-- Name: politica_cancelacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.politica_cancelacion_id_seq', 3, true);


--
-- TOC entry 5483 (class 0 OID 0)
-- Dependencies: 238
-- Name: resena_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.resena_id_seq', 5, true);


--
-- TOC entry 5484 (class 0 OID 0)
-- Dependencies: 233
-- Name: reserva_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reserva_id_seq', 13, true);


--
-- TOC entry 5485 (class 0 OID 0)
-- Dependencies: 231
-- Name: temporada_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.temporada_id_seq', 6, true);


--
-- TOC entry 5486 (class 0 OID 0)
-- Dependencies: 225
-- Name: tipo_alojamiento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipo_alojamiento_id_seq', 3, true);


--
-- TOC entry 5487 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuario_id_seq', 9, true);


--
-- TOC entry 5277 (class 2606 OID 22191)
-- Name: alojamiento alojamiento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alojamiento
    ADD CONSTRAINT alojamiento_pkey PRIMARY KEY (id);


--
-- TOC entry 5288 (class 2606 OID 22271)
-- Name: bloqueo_calendario bloqueo_calendario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bloqueo_calendario
    ADD CONSTRAINT bloqueo_calendario_pkey PRIMARY KEY (alojamiento_id, fecha);


--
-- TOC entry 5265 (class 2606 OID 22141)
-- Name: ciudad ciudad_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciudad
    ADD CONSTRAINT ciudad_nombre_key UNIQUE (nombre);


--
-- TOC entry 5267 (class 2606 OID 22139)
-- Name: ciudad ciudad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciudad
    ADD CONSTRAINT ciudad_pkey PRIMARY KEY (id);


--
-- TOC entry 5290 (class 2606 OID 22295)
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (id);


--
-- TOC entry 5273 (class 2606 OID 22169)
-- Name: politica_cancelacion politica_cancelacion_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.politica_cancelacion
    ADD CONSTRAINT politica_cancelacion_nombre_key UNIQUE (nombre);


--
-- TOC entry 5275 (class 2606 OID 22167)
-- Name: politica_cancelacion politica_cancelacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.politica_cancelacion
    ADD CONSTRAINT politica_cancelacion_pkey PRIMARY KEY (id);


--
-- TOC entry 5292 (class 2606 OID 22317)
-- Name: resena resena_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resena
    ADD CONSTRAINT resena_pkey PRIMARY KEY (id);


--
-- TOC entry 5294 (class 2606 OID 22319)
-- Name: resena resena_reserva_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resena
    ADD CONSTRAINT resena_reserva_id_key UNIQUE (reserva_id);


--
-- TOC entry 5286 (class 2606 OID 22253)
-- Name: reserva reserva_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_pkey PRIMARY KEY (id);


--
-- TOC entry 5280 (class 2606 OID 22226)
-- Name: temporada temporada_alojamiento_id_daterange_excl; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporada
    ADD CONSTRAINT temporada_alojamiento_id_daterange_excl EXCLUDE USING gist (alojamiento_id WITH =, daterange(fecha_inicio, fecha_fin, '[]'::text) WITH &&);


--
-- TOC entry 5282 (class 2606 OID 22224)
-- Name: temporada temporada_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporada
    ADD CONSTRAINT temporada_pkey PRIMARY KEY (id);


--
-- TOC entry 5269 (class 2606 OID 22151)
-- Name: tipo_alojamiento tipo_alojamiento_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_alojamiento
    ADD CONSTRAINT tipo_alojamiento_nombre_key UNIQUE (nombre);


--
-- TOC entry 5271 (class 2606 OID 22149)
-- Name: tipo_alojamiento tipo_alojamiento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_alojamiento
    ADD CONSTRAINT tipo_alojamiento_pkey PRIMARY KEY (id);


--
-- TOC entry 5261 (class 2606 OID 22131)
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- TOC entry 5263 (class 2606 OID 22129)
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- TOC entry 5278 (class 1259 OID 22327)
-- Name: idx_alojamiento_ciudad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alojamiento_ciudad ON public.alojamiento USING btree (ciudad_id);


--
-- TOC entry 5283 (class 1259 OID 22326)
-- Name: idx_reserva_alojamiento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserva_alojamiento ON public.reserva USING btree (alojamiento_id);


--
-- TOC entry 5284 (class 1259 OID 22325)
-- Name: idx_reserva_rango_fechas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserva_rango_fechas ON public.reserva USING gist (rango_fechas);


--
-- TOC entry 5295 (class 2606 OID 22192)
-- Name: alojamiento alojamiento_anfitrion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alojamiento
    ADD CONSTRAINT alojamiento_anfitrion_id_fkey FOREIGN KEY (anfitrion_id) REFERENCES public.usuario(id);


--
-- TOC entry 5296 (class 2606 OID 22202)
-- Name: alojamiento alojamiento_ciudad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alojamiento
    ADD CONSTRAINT alojamiento_ciudad_id_fkey FOREIGN KEY (ciudad_id) REFERENCES public.ciudad(id);


--
-- TOC entry 5297 (class 2606 OID 22207)
-- Name: alojamiento alojamiento_politica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alojamiento
    ADD CONSTRAINT alojamiento_politica_id_fkey FOREIGN KEY (politica_id) REFERENCES public.politica_cancelacion(id);


--
-- TOC entry 5298 (class 2606 OID 22197)
-- Name: alojamiento alojamiento_tipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alojamiento
    ADD CONSTRAINT alojamiento_tipo_id_fkey FOREIGN KEY (tipo_id) REFERENCES public.tipo_alojamiento(id);


--
-- TOC entry 5302 (class 2606 OID 22272)
-- Name: bloqueo_calendario bloqueo_calendario_alojamiento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bloqueo_calendario
    ADD CONSTRAINT bloqueo_calendario_alojamiento_id_fkey FOREIGN KEY (alojamiento_id) REFERENCES public.alojamiento(id) ON DELETE CASCADE;


--
-- TOC entry 5303 (class 2606 OID 22277)
-- Name: bloqueo_calendario bloqueo_calendario_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bloqueo_calendario
    ADD CONSTRAINT bloqueo_calendario_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reserva(id) ON DELETE CASCADE;


--
-- TOC entry 5304 (class 2606 OID 22296)
-- Name: pago pago_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reserva(id);


--
-- TOC entry 5305 (class 2606 OID 22320)
-- Name: resena resena_reserva_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resena
    ADD CONSTRAINT resena_reserva_id_fkey FOREIGN KEY (reserva_id) REFERENCES public.reserva(id);


--
-- TOC entry 5300 (class 2606 OID 22254)
-- Name: reserva reserva_alojamiento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_alojamiento_id_fkey FOREIGN KEY (alojamiento_id) REFERENCES public.alojamiento(id);


--
-- TOC entry 5301 (class 2606 OID 22259)
-- Name: reserva reserva_huesped_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserva
    ADD CONSTRAINT reserva_huesped_id_fkey FOREIGN KEY (huesped_id) REFERENCES public.usuario(id);


--
-- TOC entry 5299 (class 2606 OID 22227)
-- Name: temporada temporada_alojamiento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temporada
    ADD CONSTRAINT temporada_alojamiento_id_fkey FOREIGN KEY (alojamiento_id) REFERENCES public.alojamiento(id) ON DELETE CASCADE;


-- Completed on 2026-10-21 00:08:58

--
-- PostgreSQL database dump complete
--


