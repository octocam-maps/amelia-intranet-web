-- Semilla de usuarios E2E para los roles que NO pueden nacer solos.
--
-- Idempotente: se puede aplicar tantas veces como haga falta.
--
--     psql "postgresql://postgres:postgres@localhost:5436/postgres" \
--          -f e2e/seed/e2e-users.sql
--
-- Los otros dos roles no aparecen aquí a propósito:
--   * administrador -> ya lo siembra `database/init.sql` (people@ameliahub.com)
--   * empleado      -> se auto-provisiona en el primer login, porque el claim
--                      `hd` del id_token sintético coincide con el Workspace
--                      (ver LoginWithGoogleUseCase, caso 3)
--
-- Los emails y el `google_sub` tienen que coincidir EXACTAMENTE con
-- `e2e/fixtures/users.ts`.

BEGIN;

-- ── Socio ────────────────────────────────────────────────────────────────
-- El rol `socio` no se auto-asigna nunca: un email del Workspace sin fila
-- previa entraría como `empleado`. Se siembra ya `active`, con `google_sub`
-- en NULL para que el primer login lo vincule igual que a un usuario real.
INSERT INTO users (email, full_name, role_id, entity_id, status, is_external)
SELECT
    'e2e.socio@ameliahub.com',
    'Sergio Socio',
    (SELECT id FROM roles WHERE code = 'socio'),
    (SELECT id FROM entities WHERE code = 'hub'),
    'active',
    FALSE
ON CONFLICT (email) DO NOTHING;

-- ── Becario ──────────────────────────────────────────────────────────────
-- Migración 038 / RF-A10: navbar de empleado MENOS Control horario. El rol no
-- se auto-asigna, así que sin esta fila entraría como `empleado` y los tests
-- auditarían la pantalla equivocada con el test en verde.
INSERT INTO users (email, full_name, role_id, entity_id, status, is_external)
SELECT
    'e2e.becario@ameliahub.com',
    'Bruno Becario',
    (SELECT id FROM roles WHERE code = 'becario'),
    (SELECT id FROM entities WHERE code = 'hub'),
    'active',
    FALSE
ON CONFLICT (email) DO NOTHING;

-- ── Externo-invitado ─────────────────────────────────────────────────────
-- Gmail personal: sin claim `hd` no hay auto-provisión posible, así que la vía
-- es una invitación PENDIENTE que el caso de uso consume en el primer login
-- (`create_user_from_invitation`). `entity_id` en NULL, como todo externo.
INSERT INTO invitations (email, role_id, entity_id, token, invited_by, status, expires_at)
SELECT
    'e2e.externo@gmail.com',
    (SELECT id FROM roles WHERE code = 'externo_invitado'),
    NULL,
    'e2e-invitation-token-externo',
    (SELECT id FROM users WHERE email = 'people@ameliahub.com'),
    'pending',
    -- Holgado a propósito: una invitación caducada haría fallar los E2E con un
    -- 403 desconcertante semanas después de sembrarla.
    CURRENT_TIMESTAMP + INTERVAL '10 years'
WHERE NOT EXISTS (
    SELECT 1 FROM invitations
    WHERE email = 'e2e.externo@gmail.com' AND status = 'pending'
);

COMMIT;
