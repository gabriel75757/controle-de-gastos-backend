import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { json } from 'express';
import admin from 'firebase-admin';
import { transactionsRouter } from './transactions/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Projeto Firebase esperado. Se a chave de serviço for de OUTRO projeto, a API não sobe.
const EXPECTED_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'controle-de-gastos-1d25b';
const PORT = process.env.PORT || 3000;

/**
 * Ordem de busca da credencial:
 *  1. FIREBASE_SERVICE_ACCOUNT  -> conteúdo JSON da chave (ideal para deploy: Render, Railway, etc.)
 *  2. GOOGLE_APPLICATION_CREDENTIALS -> caminho do arquivo JSON
 *  3. ./serviceAccountKey.json ao lado deste index.js (desenvolvimento local)
 */
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    || path.join(__dirname, 'serviceAccountKey.json');

  if (!existsSync(filePath)) {
    throw new Error(
      `Chave de serviço não encontrada em "${filePath}". ` +
      'Baixe em Console Firebase > Configurações do projeto > Contas de serviço > Gerar nova chave privada.'
    );
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

const serviceAccount = loadServiceAccount();

if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
  throw new Error(
    `A chave de serviço é do projeto "${serviceAccount.project_id}", ` +
    `mas o esperado é "${EXPECTED_PROJECT_ID}". Gere a chave no projeto correto.`
  );
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: EXPECTED_PROJECT_ID
});

// Evita o erro "Cannot use undefined as a Firestore value"
admin.firestore().settings({ ignoreUndefinedProperties: true });

const app = express();

app.use(json());

// CORS. Sem ALLOWED_ORIGINS libera tudo (ok para estudo). Em produção:
// ALLOWED_ORIGINS=https://meusite.com,http://localhost:5500
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use((request, response, next) => {
  const origin = request.headers.origin;

  if (allowedOrigins.length === 0) {
    response.header('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    response.header('Access-Control-Allow-Origin', origin);
    response.header('Vary', 'Origin');
  }

  response.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PATCH,DELETE');
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  response.header('Access-Control-Max-Age', '600');

  // Preflight: responde aqui, ANTES de exigir autenticação (o preflight não envia o token)
  if (request.method === 'OPTIONS') {
    return response.sendStatus(204);
  }
  next();
});

app.use('/transactions', transactionsRouter);

// 404 para rotas inexistentes
app.use((request, response) => {
  response.status(404).json({ name: 'not-found', code: 404, message: 'Rota não encontrada' });
});

// Erros não tratados (ex.: JSON malformado no body)
app.use((error, request, response, next) => {
  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ name: 'bad-request', code: 400, message: 'JSON inválido' });
  }
  console.error(error);
  response.status(500).json({ name: 'internal-error', code: 500, message: 'Erro interno' });
});

app.listen(PORT, () => console.log(`API rest iniciada em http://localhost:${PORT}`));
