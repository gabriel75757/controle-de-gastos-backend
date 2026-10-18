import { UserNotAuthorizedError } from "./errors/user-not-authorized.error.js";

const error = new UserNotAuthorizedError();

export async function authenticateToken(request, response, next, auth) {
    // Aceita "Authorization: <token>" e "Authorization: Bearer <token>"
    const header = request.headers.authorization;
    const jwt = header?.replace(/^Bearer\s+/i, "").trim();

    if (!jwt) {
        response.status(error.code).json(error);
        return;
    }

    let decodedIdToken = "";
    try {
        // true = também verifica se o token foi revogado
        decodedIdToken = await auth.verifyIdToken(jwt, true);
    } catch (e) {
        // Token expirado, inválido ou de outro projeto Firebase
        console.warn("Token rejeitado:", e?.code || e?.message);
        response.status(error.code).json(error);
        return;
    }

    request.user = {
        uid: decodedIdToken.sub
    }

    next();
}
