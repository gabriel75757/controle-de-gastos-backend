import admin from 'firebase-admin';

const COLLECTION = 'transactions';

const db = () => admin.firestore();

export class TransactionRepository {

    // Requer índice composto (user.uid ASC + date DESC). Veja firestore.indexes.json.
    findByUserUid(uid) {
        return db()
            .collection(COLLECTION)
            .where('user.uid', '==', uid)
            .orderBy('date', 'desc')
            .get()
            .then(snapshot => {
                return snapshot.docs.map(doc => ({
                    ...doc.data(),
                    uid: doc.id
                }))
            })
    }

    findByUid(uid) {
        return db()
            .collection(COLLECTION)
            .doc(uid)
            .get()
            .then(snapshot => snapshot.exists ? snapshot.data() : undefined);
    }

    save(transaction) {
        // Campos explícitos: só o que deve ir para o banco
        return db()
            .collection(COLLECTION)
            .add({
                date: transaction.date,
                description: transaction.description,
                money: transaction.money,
                transactionType: transaction.transactionType,
                type: transaction.type,
                user: { uid: transaction.user.uid }
            })
            .then(response => ({uid: response.id}));
    }

    update(transaction) {
        return db()
            .collection(COLLECTION)
            .doc(transaction.uid)
            .update({
                date: transaction.date,
                description: transaction.description,
                money: transaction.money,
                transactionType: transaction.transactionType,
                type: transaction.type
            })
    }

    delete(transaction) {
        return db()
            .collection(COLLECTION)
            .doc(transaction.uid)
            .delete();
    }

}
