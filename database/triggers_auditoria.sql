-- 1. Trigger para validar confirmaciones.
CREATE OR REPLACE FUNCTION public.fn_validar_confirmacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_capacidad INTEGER;
    v_estadia_minima INTEGER;
BEGIN
    -- Solo validar reservas que se estan confirmando.
    IF NEW.estado <> 'CONFIRMADA' THEN
        RETURN NEW;
    END IF;

    IF NEW.fecha_checkin IS NULL
       OR NEW.fecha_checkout IS NULL
       OR NEW.fecha_checkout <= NEW.fecha_checkin THEN
        RAISE EXCEPTION 'Las fechas de la reserva son invalidas';
    END IF;

    -- Bloqueo por alojamiento para prevenir confirmaciones simultaneas.
    SELECT capacidad_max, estadia_minima
      INTO v_capacidad, v_estadia_minima
    FROM public.alojamiento
    WHERE id = NEW.alojamiento_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El alojamiento no existe';
    END IF;

    IF NEW.num_huespedes > v_capacidad THEN
        RAISE EXCEPTION 'Se supera la capacidad maxima permitida';
    END IF;

    IF (NEW.fecha_checkout - NEW.fecha_checkin) < v_estadia_minima THEN
        RAISE EXCEPTION 'La reserva no cumple la estadia minima';
    END IF;

    -- No permitir reservas superpuestas.
    IF EXISTS (
        SELECT 1
        FROM public.reserva r
        WHERE r.alojamiento_id = NEW.alojamiento_id
          AND r.id IS DISTINCT FROM NEW.id
          AND r.estado IN ('CONFIRMADA', 'COMPLETADA')
          AND r.rango_fechas &&
              daterange(NEW.fecha_checkin, NEW.fecha_checkout, '[)')
    ) THEN
        RAISE EXCEPTION 'Conflicto: fechas ya reservadas';
    END IF;

    -- Bloqueos que correspondan a otras reservas.
    IF EXISTS (
        SELECT 1
        FROM public.bloqueo_calendario b
        WHERE b.alojamiento_id = NEW.alojamiento_id
          AND b.reserva_id IS DISTINCT FROM NEW.id
          AND b.fecha >= NEW.fecha_checkin
          AND b.fecha < NEW.fecha_checkout
    ) THEN
        RAISE EXCEPTION 'Conflicto: fechas bloqueadas';
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_validar_confirmacion
BEFORE INSERT OR UPDATE OF
    alojamiento_id, fecha_checkin, fecha_checkout,
    num_huespedes, estado
ON public.reserva
FOR EACH ROW
EXECUTE FUNCTION public.fn_validar_confirmacion();


-- 2. Tabla de auditoria .
CREATE TABLE IF NOT EXISTS public.auditoria_cambios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entidad VARCHAR(40) NOT NULL,
    registro_id INTEGER NOT NULL,
    campo VARCHAR(50) NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario_id INTEGER,
    usuario_bd TEXT NOT NULL DEFAULT CURRENT_USER,
    fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_cambios_fecha
ON public.auditoria_cambios (fecha_cambio);


-- 3. Auditar precio base y politica asignada a un alojamiento.
CREATE OR REPLACE FUNCTION public.fn_auditar_alojamiento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_actor TEXT;
    v_usuario_id INTEGER;
BEGIN
    -- El backend puede identificar al usuario autenticado
    -- mediante SET LOCAL app.usuario_id = '...'.
    v_actor := current_setting('app.usuario_id', TRUE);

    IF v_actor ~ '^[0-9]{1,9}$' THEN
        v_usuario_id := v_actor::INTEGER;
    END IF;

    IF NEW.precio_base_noche IS DISTINCT FROM OLD.precio_base_noche THEN
        INSERT INTO public.auditoria_cambios (
            entidad, registro_id, campo,
            valor_anterior, valor_nuevo, usuario_id
        )
        VALUES (
            'ALOJAMIENTO', NEW.id, 'precio_base_noche',
            OLD.precio_base_noche::TEXT,
            NEW.precio_base_noche::TEXT,
            v_usuario_id
        );
    END IF;

    IF NEW.politica_id IS DISTINCT FROM OLD.politica_id THEN
        INSERT INTO public.auditoria_cambios (
            entidad, registro_id, campo,
            valor_anterior, valor_nuevo, usuario_id
        )
        VALUES (
            'ALOJAMIENTO', NEW.id, 'politica_id',
            OLD.politica_id::TEXT,
            NEW.politica_id::TEXT,
            v_usuario_id
        );
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_auditar_alojamiento
AFTER UPDATE OF precio_base_noche, politica_id
ON public.alojamiento
FOR EACH ROW
EXECUTE FUNCTION public.fn_auditar_alojamiento();


-- 4. Auditar tambien cambios en las reglas de una politica.
CREATE OR REPLACE FUNCTION public.fn_auditar_politica()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_actor TEXT;
    v_usuario_id INTEGER;
BEGIN
    IF ROW(
        OLD.nombre, OLD.dias_antelacion_total,
        OLD.dias_antelacion_parcial, OLD.pct_reembolso_parcial
    ) IS NOT DISTINCT FROM ROW(
        NEW.nombre, NEW.dias_antelacion_total,
        NEW.dias_antelacion_parcial, NEW.pct_reembolso_parcial
    ) THEN
        RETURN NEW;
    END IF;

    v_actor := current_setting('app.usuario_id', TRUE);

    IF v_actor ~ '^[0-9]{1,9}$' THEN
        v_usuario_id := v_actor::INTEGER;
    END IF;

    INSERT INTO public.auditoria_cambios (
        entidad, registro_id, campo,
        valor_anterior, valor_nuevo, usuario_id
    )
    VALUES (
        'POLITICA_CANCELACION',
        NEW.id,
        'configuracion',
        jsonb_build_object(
            'nombre', OLD.nombre,
            'dias_antelacion_total', OLD.dias_antelacion_total,
            'dias_antelacion_parcial', OLD.dias_antelacion_parcial,
            'pct_reembolso_parcial', OLD.pct_reembolso_parcial
        )::TEXT,
        jsonb_build_object(
            'nombre', NEW.nombre,
            'dias_antelacion_total', NEW.dias_antelacion_total,
            'dias_antelacion_parcial', NEW.dias_antelacion_parcial,
            'pct_reembolso_parcial', NEW.pct_reembolso_parcial
        )::TEXT,
        v_usuario_id
    );

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_auditar_politica
AFTER UPDATE ON public.politica_cancelacion
FOR EACH ROW
EXECUTE FUNCTION public.fn_auditar_politica();