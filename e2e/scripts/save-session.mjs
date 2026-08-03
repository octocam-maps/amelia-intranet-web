/**
 * Graba una sesión autenticada en `e2e/.auth/<rol>.json` para que el agente
 * auditor (Playwright MCP) navegue la app con el rol que se le pida.
 *
 *     node e2e/scripts/save-session.mjs administrador
 *
 * ## Por qué aquí sí vale `storageState` y en los tests no
 *
 * El refresh token rota en cada uso y reutilizar uno ya rotado revoca la
 * familia entera. En la suite eso es fatal, porque varios contextos parten del
 * mismo estado en paralelo. El agente auditor, en cambio, abre UN navegador:
 * la cookie rota dentro de su propio tarro y nadie la reutiliza.
 *
 * Consecuencia práctica: el fichero sirve para UNA sesión de auditoría. Si el
 * agente cierra el navegador y arranca otro con el mismo fichero, la cookie ya
 * estará rotada y el backend responderá 401. Vuelve a ejecutar este script
 * antes de cada sesión — cuesta un segundo.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { request } from '@playwright/test';

const ROLES = {
  administrador: {
    sub: 'e2e-administrador',
    email: 'people@ameliahub.com',
    name: 'Beatriz Luna',
    hd: 'ameliahub.com',
  },
  empleado: {
    sub: 'e2e-empleado',
    email: 'e2e.empleado@ameliahub.com',
    name: 'Elena Empleada',
    hd: 'ameliahub.com',
  },
  socio: {
    sub: 'e2e-socio',
    email: 'e2e.socio@ameliahub.com',
    name: 'Sergio Socio',
    hd: 'ameliahub.com',
  },
  externo: {
    sub: 'e2e-externo',
    email: 'e2e.externo@gmail.com',
    name: 'Extranjero Invitado',
  },
};

function apiBaseUrl() {
  if (process.env.E2E_API_BASE_URL) return process.env.E2E_API_BASE_URL;
  try {
    const contents = readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
    const match = contents.match(/^\s*VITE_API_BASE_URL\s*=\s*(.+)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  } catch {
    /* sin .env: default */
  }
  return 'http://localhost:8000';
}

function buildFakeIdToken(identity) {
  const payload = {
    sub: identity.sub,
    email: identity.email,
    email_verified: true,
    name: identity.name,
  };
  if (identity.hd) payload.hd = identity.hd;
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8')
    .toString('base64url')
    .replace(/=+$/, '');
  return `fake-google-id-token.${encoded}`;
}

const role = process.argv[2] ?? 'administrador';
const identity = ROLES[role];

if (!identity) {
  console.error(`Rol desconocido: "${role}". Opciones: ${Object.keys(ROLES).join(', ')}`);
  process.exit(1);
}

const baseURL = apiBaseUrl();
const api = await request.newContext({ baseURL });

try {
  const response = await api.post('/auth/login', {
    data: { id_token: buildFakeIdToken(identity) },
    failOnStatusCode: false,
  });

  if (!response.ok()) {
    console.error(
      `\nLogin fallido (${response.status()}) contra ${baseURL}.\n` +
        (response.status() === 401
          ? 'El backend no acepta id_tokens sintéticos: arráncalo con GOOGLE_OIDC_PROVIDER=fake.\n'
          : '') +
        (response.status() === 403
          ? `El usuario ${identity.email} no existe ni tiene invitación. Aplica e2e/seed/e2e-users.sql.\n`
          : '') +
        `Respuesta: ${await response.text()}\n`,
    );
    process.exit(1);
  }

  const body = await response.json();
  const state = await api.storageState();

  const outputDir = path.resolve(process.cwd(), 'e2e/.auth');
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${role}.json`);
  await writeFile(outputPath, JSON.stringify(state, null, 2), 'utf-8');

  console.log(
    `✓ Sesión de ${body.user.role} (${body.user.email}) guardada en ${path.relative(process.cwd(), outputPath)}\n` +
      `  Válida para UNA sesión de auditoría. Vuelve a ejecutarlo si el navegador se reinicia.`,
  );
} finally {
  await api.dispose();
}
