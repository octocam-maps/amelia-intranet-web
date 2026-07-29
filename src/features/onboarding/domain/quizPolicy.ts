/**
 * Techo de intentos del cuestionario del onboarding (RF-A9, migración
 * `034_quiz_two_attempts.sql`). Espejo de `MAX_QUIZ_ATTEMPTS` en
 * `back/src/features/onboarding/domain/policy.py`, que sigue siendo la ÚNICA
 * autoridad: el backend rechaza el tercer envío con 409 aunque este número
 * mintiera. Aquí solo existe para el COPY.
 *
 * Por qué es una constante y no un literal: el número vivía escrito a mano en
 * tres sitios de copy (el banner del cuestionario, el mensaje de intentos
 * agotados y la descripción del paso en el panel del admin). Al subir el techo
 * de 1 a 2 se actualizaron los dos primeros y el del admin se quedó atrás
 * diciendo "cuestionario de 1 intento" — que es justo lo que RRHH lee para
 * explicar la regla. Un único origen impide que vuelva a descuadrarse.
 *
 * Si cambia el techo, cámbialo en el backend PRIMERO y ajusta este espejo.
 */
export const MAX_QUIZ_ATTEMPTS = 2;
