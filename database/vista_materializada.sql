-- Dashboard: ocupacion e ingresos por mes, ciudad y tipo.
CREATE MATERIALIZED VIEW IF NOT EXISTS
public.mv_ocupacion_ingresos_mensuales
AS
WITH meses AS (
    -- Ventana de 25 meses: 12 anteriores, actual y 12 siguientes.
    SELECT generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '12 months',
        date_trunc('month', CURRENT_DATE) + INTERVAL '12 months',
        INTERVAL '1 month'
    )::DATE AS mes
),
inventario AS (
    SELECT
        ciudad_id,
        tipo_id,
        COUNT(*)::INTEGER AS total_alojamientos
    FROM public.alojamiento
    WHERE estado_publicacion = 'PUBLICADO'
    GROUP BY ciudad_id, tipo_id
),
ocupacion AS (
    -- Una reserva ocupa desde checkin hasta el dia anterior a checkout.
    SELECT
        date_trunc('month', dias.dia)::DATE AS mes,
        a.ciudad_id,
        a.tipo_id,
        COUNT(*)::BIGINT AS noches_ocupadas
    FROM public.reserva r
    JOIN public.alojamiento a
        ON a.id = r.alojamiento_id
    CROSS JOIN LATERAL generate_series(
        r.fecha_checkin::TIMESTAMP,
        (r.fecha_checkout - 1)::TIMESTAMP,
        INTERVAL '1 day'
    ) AS dias(dia)
    WHERE r.estado IN ('CONFIRMADA', 'COMPLETADA')
      AND a.estado_publicacion = 'PUBLICADO'
    GROUP BY 1, 2, 3
),
ingresos AS (
    -- Ingresos netos segun fecha de pago o reembolso.
    SELECT
        date_trunc('month', p.fecha_pago)::DATE AS mes,
        a.ciudad_id,
        a.tipo_id,
        SUM(
            CASE
                WHEN p.tipo = 'PAGO' THEN p.monto
                WHEN p.tipo = 'REEMBOLSO' THEN -p.monto
                ELSE 0
            END
        )::NUMERIC(14,2) AS ingresos_netos
    FROM public.pago p
    JOIN public.reserva r ON r.id = p.reserva_id
    JOIN public.alojamiento a ON a.id = r.alojamiento_id
    WHERE a.estado_publicacion = 'PUBLICADO'
    GROUP BY 1, 2, 3
)
SELECT
    m.mes,
    c.id AS ciudad_id,
    c.nombre AS ciudad,
    t.id AS tipo_id,
    t.nombre AS tipo_alojamiento,
    i.total_alojamientos,
    COALESCE(o.noches_ocupadas, 0)::BIGINT AS noches_ocupadas,
    (
        i.total_alojamientos *
        ((m.mes + INTERVAL '1 month')::DATE - m.mes)
    )::INTEGER AS noches_disponibles,
    ROUND(
        100.0 * COALESCE(o.noches_ocupadas, 0) /
        NULLIF(
            i.total_alojamientos *
            ((m.mes + INTERVAL '1 month')::DATE - m.mes),
            0
        ),
        2
    ) AS porcentaje_ocupacion,
    COALESCE(ing.ingresos_netos, 0)::NUMERIC(14,2)
        AS ingresos_netos
FROM meses m
CROSS JOIN inventario i
JOIN public.ciudad c ON c.id = i.ciudad_id
JOIN public.tipo_alojamiento t ON t.id = i.tipo_id
LEFT JOIN ocupacion o
    ON o.mes = m.mes
   AND o.ciudad_id = i.ciudad_id
   AND o.tipo_id = i.tipo_id
LEFT JOIN ingresos ing
    ON ing.mes = m.mes
   AND ing.ciudad_id = i.ciudad_id
   AND ing.tipo_id = i.tipo_id
WITH DATA;


-- Evitar filas duplicadas por mes, ciudad y tipo.
CREATE UNIQUE INDEX IF NOT EXISTS
idx_mv_ocupacion_ciudad_tipo_mes
ON public.mv_ocupacion_ingresos_mensuales
(mes, ciudad_id, tipo_id);


-- Procedimiento de actualizacion del dashboard.
CREATE OR REPLACE PROCEDURE public.sp_refrescar_dashboard()
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW
        public.mv_ocupacion_ingresos_mensuales;
END;
$$;