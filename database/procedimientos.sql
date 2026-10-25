CREATE OR REPLACE PROCEDURE public.sp_confirmar_reserva(
    IN p_alojamiento_id INTEGER,
    IN p_huesped_id INTEGER,
    IN p_checkin DATE,
    IN p_checkout DATE,
    IN p_num_huespedes INTEGER,
    INOUT p_reserva_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_capacidad INTEGER;
    v_estadia_minima INTEGER;
    v_estado_publicacion VARCHAR(12);
    v_total NUMERIC(12,2);
BEGIN
    -- Validar fechas y cantidad de huespedes.
    IF p_checkin IS NULL OR p_checkout IS NULL
       OR p_checkout <= p_checkin THEN
        RAISE EXCEPTION 'El checkout debe ser posterior al checkin';
    END IF;

    IF p_num_huespedes IS NULL OR p_num_huespedes < 1 THEN
        RAISE EXCEPTION 'La cantidad de huespedes debe ser positiva';
    END IF;

    -- Solo usuarios activos con rol HUESPED.
    PERFORM 1
    FROM public.usuario
    WHERE id = p_huesped_id
      AND rol = 'HUESPED'
      AND estado = 'ACTIVO';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El huesped % no existe o no esta activo', p_huesped_id;
    END IF;

    -- Bloquear el alojamiento para evitar confirmaciones simultaneas.
    SELECT capacidad_max, estadia_minima, estado_publicacion
      INTO v_capacidad, v_estadia_minima, v_estado_publicacion
    FROM public.alojamiento
    WHERE id = p_alojamiento_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El alojamiento % no existe', p_alojamiento_id;
    END IF;

    IF v_estado_publicacion <> 'PUBLICADO' THEN
        RAISE EXCEPTION 'El alojamiento no esta publicado';
    END IF;

    IF p_num_huespedes > v_capacidad THEN
        RAISE EXCEPTION 'Se supera la capacidad maxima del alojamiento';
    END IF;

    IF (p_checkout - p_checkin) < v_estadia_minima THEN
        RAISE EXCEPTION 'No se cumple la estadia minima';
    END IF;

    -- Evitar cruces con reservas confirmadas o completadas.
    IF EXISTS (
        SELECT 1
        FROM public.reserva r
        WHERE r.alojamiento_id = p_alojamiento_id
          AND r.estado IN ('CONFIRMADA', 'COMPLETADA')
          AND r.rango_fechas && daterange(p_checkin, p_checkout, '[)')
    ) THEN
        RAISE EXCEPTION 'El alojamiento ya tiene una reserva en esas fechas';
    END IF;

    -- Revisar tambien el calendario de bloqueos.
    IF EXISTS (
        SELECT 1
        FROM public.bloqueo_calendario b
        WHERE b.alojamiento_id = p_alojamiento_id
          AND b.fecha >= p_checkin
          AND b.fecha < p_checkout
    ) THEN
        RAISE EXCEPTION 'Hay fechas bloqueadas en el calendario';
    END IF;

    -- Utilizar la funcion de precios de la BD base.
    SELECT public.fn_calcular_total(
        p_alojamiento_id, p_checkin, p_checkout
    )
    INTO v_total;

    IF v_total IS NULL OR v_total <= 0 THEN
        RAISE EXCEPTION 'No fue posible calcular el total de la reserva';
    END IF;

    -- Crear la reserva ya confirmada.
    INSERT INTO public.reserva (
        alojamiento_id, huesped_id, fecha_checkin,
        fecha_checkout, num_huespedes, total, estado
    )
    VALUES (
        p_alojamiento_id, p_huesped_id, p_checkin,
        p_checkout, p_num_huespedes, v_total, 'CONFIRMADA'
    )
    RETURNING id INTO p_reserva_id;

    -- Registrar pago.
    INSERT INTO public.pago (reserva_id, tipo, monto)
    VALUES (p_reserva_id, 'PAGO', v_total);

    -- Bloquear cada noche, excluyendo la fecha de checkout.
    INSERT INTO public.bloqueo_calendario (
        alojamiento_id, fecha, reserva_id
    )
    SELECT p_alojamiento_id, dia::DATE, p_reserva_id
    FROM generate_series(
        p_checkin::TIMESTAMP,
        (p_checkout - 1)::TIMESTAMP,
        INTERVAL '1 day'
    ) AS dias(dia);
END;
$$;


CREATE OR REPLACE PROCEDURE public.sp_cancelar_reserva(
    IN p_reserva_id INTEGER,
    IN p_huesped_id INTEGER,
    INOUT p_reembolso NUMERIC DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_propietario INTEGER;
    v_estado VARCHAR(12);
    v_total NUMERIC(12,2);
    v_porcentaje NUMERIC;
    v_saldo_pagado NUMERIC(12,2);
BEGIN
    -- Bloquear la reserva durante la cancelacion.
    SELECT huesped_id, estado, total
      INTO v_propietario, v_estado, v_total
    FROM public.reserva
    WHERE id = p_reserva_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La reserva % no existe', p_reserva_id;
    END IF;

    IF v_propietario <> p_huesped_id THEN
        RAISE EXCEPTION 'Solo el huesped propietario puede cancelar la reserva';
    END IF;

    IF v_estado NOT IN ('PENDIENTE', 'CONFIRMADA') THEN
        RAISE EXCEPTION 'La reserva no puede cancelarse en estado %', v_estado;
    END IF;

    p_reembolso := 0;

    IF v_estado = 'CONFIRMADA' THEN
        -- Calcular porcentaje segun la politica vigente.
        SELECT public.fn_porcentaje_reembolso(
            p_reserva_id, CURRENT_DATE
        )
        INTO v_porcentaje;

        -- Dinero efectivamente pagado menos reembolsos anteriores.
        SELECT COALESCE(SUM(
            CASE
                WHEN tipo = 'PAGO' THEN monto
                WHEN tipo = 'REEMBOLSO' THEN -monto
                ELSE 0
            END
        ), 0)
        INTO v_saldo_pagado
        FROM public.pago
        WHERE reserva_id = p_reserva_id;

        p_reembolso := LEAST(
            GREATEST(v_saldo_pagado, 0),
            ROUND(v_total * COALESCE(v_porcentaje, 0) / 100, 2)
        );
    END IF;

    UPDATE public.reserva
    SET estado = 'CANCELADA'
    WHERE id = p_reserva_id;

    -- El CHECK de pago requiere montos positivos.
    IF p_reembolso > 0 THEN
        INSERT INTO public.pago (reserva_id, tipo, monto)
        VALUES (p_reserva_id, 'REEMBOLSO', p_reembolso);
    END IF;

    -- Liberar todas las noches de esta reserva.
    DELETE FROM public.bloqueo_calendario
    WHERE reserva_id = p_reserva_id;
END;
$$;