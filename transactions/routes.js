import express from 'express';
import admin from 'firebase-admin';
import { authenticateToken } from '../middlewares/authenticate-jwt.js';
import { TransactionController } from './controller.js';
import { validateTransaction } from './validators/transaction.validator.js';

const router = express.Router();

// Autenticação PRIMEIRO, para todas as rotas: quem não está logado nem chega na validação.
router.use((request, response, next) => authenticateToken(request, response, next, admin.auth()));

router.get('/',
    (request, response) => new TransactionController().findByUser(request, response)
);
router.get('/:uid',
    (request, response) => new TransactionController().findByUid(request, response)
);
router.post('/',
    (request, response, next) => validateTransaction(request, response, next),
    (request, response) => new TransactionController().create(request, response)
);
router.patch('/:uid',
    (request, response, next) => validateTransaction(request, response, next),
    (request, response) => new TransactionController().update(request, response)
);
router.delete('/:uid',
    (request, response) => new TransactionController().delete(request, response)
);

export const transactionsRouter = router;
