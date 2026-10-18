import { Transaction } from './model.js';

// Erros do domínio têm "code" HTTP (400, 401, 403, 404...). Erros do Firestore têm
// códigos gRPC (ex.: 9) ou strings, que NÃO são status HTTP válidos e derrubavam a API.
function sendError(response, error) {
    const code = error?.code;
    if (Number.isInteger(code) && code >= 400 && code < 600) {
        return response.status(code).json(error);
    }
    console.error(error);
    return response.status(500).json({
        name: 'internal-error',
        code: 500,
        message: 'Erro interno ao acessar o banco de dados'
    });
}

export class TransactionController {

    #transaction;

    constructor(transaction) {
        this.#transaction = transaction || new Transaction();
    }

    findByUser(request, response) {
        this.#transaction.user = request.user;

        return this.#transaction.findByUser().then(transactions => {
            response.status(200).json(transactions);
        }).catch(error => sendError(response, error))
    }

    findByUid(request, response) {
        this.#transaction.uid = request.params.uid;
        this.#transaction.user = request.user;

        return this.#transaction.findByUid().then(() => {
            response.status(200).json(this.#transaction);
        }).catch(error => sendError(response, error));
    }

    create(request, response) {
        this.#transaction.user = request.user;

        // O dono vem SEMPRE do token validado, nunca do body (senão dá para criar em nome de outro usuário)
        const params = { ...request.body, user: request.user };

        return this.#transaction.create(params).then(() => {
            response.status(200).json(this.#transaction);
        }).catch(error => sendError(response, error))
    }

    update(request, response) {
        this.#transaction.uid = request.params.uid;
        this.#transaction.user = request.user;

        return this.#transaction.update(request.body).then(() => {
            response.status(200).json(this.#transaction);
        }).catch(error => sendError(response, error));
    }

    delete(request, response) {
        this.#transaction.uid = request.params.uid;
        this.#transaction.user = request.user;

        return this.#transaction.delete().then(() => {
            response.status(200).json(this.#transaction);
        }).catch(error => sendError(response, error))
    }

}
