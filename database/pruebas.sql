-- Pruebas automaticas. No conservar cambios.
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_inicio DATE := CURRENT_DATE + 400;
    v_reserva_id INTEGER;
    v_intento_id INTEGER;
    v_total NUMERIC;
    v_reembolso NUMERIC;
    v_noches INTEGER;
    v_registros INTEGER;
    v_rechazo BOOLEAN;
BEGIN
    -- PRUEBA 1: confirmar reserva y calcular total.
    CALL public.sp_confirmar_reserva(
        1, 5, v_inicio, v_inicio + 2, 2, v_reserva_id
    );

    SELECT total INTO v_total
    FROM public.reserva
    WHERE id = v_reserva_id
      AND estado = 'CONFIRMADA';

    IF v_total IS NULL OR v_total <= 0 THEN
        RAISE EXCEPTION 'Fallo: confirmacion o calculo del total';
    END IF;

    -- Verificar registro del pago.
    IF NOT EXISTS (
        SELECT 1
        FROM public.pago
        WHERE reserva_id = v_reserva_id
          AND tipo = 'PAGO'
          AND monto = v_total
    ) THEN
        RAISE EXCEPTION 'Fallo: no se registro el pago';
    END IF;

    -- Verificar que se bloquearon exactamente 2 noches.
    SELECT COUNT(*) INTO v_noches
    FROM public.bloqueo_calendario
    WHERE reserva_id = v_reserva_id;

    IF v_noches <> 2 THEN
        RAISE EXCEPTION 'Fallo: calendario incorrecto';
    END IF;

    RAISE NOTICE 'OK - Confirmacion, pago y bloqueo de fechas';

    -- PRUEBA 2: impedir fechas superpuestas.
    v_rechazo := FALSE;
    BEGIN
        CALL public.sp_confirmar_reserva(
            1, 6, v_inicio + 1, v_inicio + 3, 2, v_intento_id
        );
    EXCEPTION WHEN OTHERS THEN
        v_rechazo := TRUE;
    END;

    IF NOT v_rechazo THEN
        RAISE EXCEPTION 'Fallo: se aceptaron fechas superpuestas';
    END IF;

    RAISE NOTICE 'OK - Rechazo de reservas superpuestas';

    -- PRUEBA 3: impedir superar capacidad (alojamiento 1: 4).
    v_rechazo := FALSE;
    BEGIN
        CALL public.sp_confirmar_reserva(
            1, 6, v_inicio + 10, v_inicio + 12, 5, v_intento_id
        );
    EXCEPTION WHEN OTHERS THEN
        v_rechazo := TRUE;
    END;

    IF NOT v_rechazo THEN
        RAISE EXCEPTION 'Fallo: se supero la capacidad';
    END IF;

    RAISE NOTICE 'OK - Validacion de capacidad';

    -- PRUEBA 4: estadia minima (alojamiento 2: 2 noches).
    v_rechazo := FALSE;
    BEGIN
        CALL public.sp_confirmar_reserva(
            2, 5, v_inicio + 10, v_inicio + 11, 2, v_intento_id
        );
    EXCEPTION WHEN OTHERS THEN
        v_rechazo := TRUE;
    END;

    IF NOT v_rechazo THEN
        RAISE EXCEPTION 'Fallo: se permitio una estadia demasiado corta';
    END IF;

    RAISE NOTICE 'OK - Validacion de estadia minima';

    -- PRUEBA 5: otro huesped no puede cancelar.
    v_rechazo := FALSE;
    BEGIN
        CALL public.sp_cancelar_reserva(
            v_reserva_id, 6, v_reembolso
        );
    EXCEPTION WHEN OTHERS THEN
        v_rechazo := TRUE;
    END;

    IF NOT v_rechazo THEN
        RAISE EXCEPTION 'Fallo: se permitio cancelar una reserva ajena';
    END IF;

    RAISE NOTICE 'OK - Proteccion del propietario';

    -- PRUEBA 6: cancelacion con politica flexible.
    CALL public.sp_cancelar_reserva(
        v_reserva_id, 5, v_reembolso
    );

    IF v_reembolso <> v_total THEN
        RAISE EXCEPTION 'Fallo: calculo de reembolso';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.pago
        WHERE reserva_id = v_reserva_id
          AND tipo = 'REEMBOLSO'
          AND monto = v_reembolso
    ) THEN
        RAISE EXCEPTION 'Fallo: falta registro de reembolso';
    END IF;

    SELECT COUNT(*) INTO v_noches
    FROM public.bloqueo_calendario
    WHERE reserva_id = v_reserva_id;

    IF v_noches <> 0 THEN
        RAISE EXCEPTION 'Fallo: no se liberaron las fechas';
    END IF;

    RAISE NOTICE 'OK - Cancelacion, reembolso y liberacion';

    -- PRUEBA 7: auditoria de alojamiento.
    PERFORM set_config('app.usuario_id', '2', TRUE);

    UPDATE public.alojamiento
    SET precio_base_noche = precio_base_noche + 100,
        politica_id = 2
    WHERE id = 1;

    SELECT COUNT(*) INTO v_registros
    FROM public.auditoria_cambios
    WHERE entidad = 'ALOJAMIENTO'
      AND registro_id = 1
      AND usuario_id = 2;

    IF v_registros < 2 THEN
        RAISE EXCEPTION 'Fallo: auditoria de alojamiento';
    END IF;

    RAISE NOTICE 'OK - Auditoria de precio y politica asignada';

    -- PRUEBA 8: auditoria de reglas de cancelacion.
    UPDATE public.politica_cancelacion
    SET pct_reembolso_parcial = pct_reembolso_parcial + 1
    WHERE id = 1;

    IF NOT EXISTS (
        SELECT 1
        FROM public.auditoria_cambios
        WHERE entidad = 'POLITICA_CANCELACION'
          AND registro_id = 1
          AND usuario_id = 2
    ) THEN
        RAISE EXCEPTION 'Fallo: auditoria de politica';
    END IF;

    RAISE NOTICE 'OK - Auditoria de reglas de cancelacion';
END;
$$;

-- PRUEBA 9: actualizar y consultar la vista materializada.
CALL public.sp_refrescar_dashboard();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.mv_ocupacion_ingresos_mensuales
    ) THEN
        RAISE EXCEPTION 'Fallo: la vista materializada no tiene datos';
    END IF;

    RAISE NOTICE 'OK - Vista materializada y actualizacion';
END;
$$;

-- Deshacer todas las reservas, pagos y actualizaciones de prueba.
ROLLBACK;

\echo 'Pruebas finalizadas. Los datos originales se conservaron.'