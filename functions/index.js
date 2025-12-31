
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

const db = admin.firestore();

// Configuração do Asaas (Deve estar nas variáveis de ambiente em produção)
// use: firebase functions:config:set asaas.apikey="SUA_API_KEY" asaas.url="https://www.asaas.com/api/v3"
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmIyNDliNTViLThlYTAtNDRiOC1hNGJiLThmNGIxN2NmOGE0Zjo6JGFhY2hfNDI3OGNiMzMtYjMxNi00MDQ5LWI0OTctMTRmZmE4ZjBjZjYx'; // Chave de Sandbox ou Produção
const ASAAS_URL = process.env.ASAAS_URL || 'https://sandbox.asaas.com/api/v3';

/**
 * Função Callable para criar uma cobrança no Asaas.
 * Chamada pelo Frontend quando o usuário clica em "Comprar".
 */
exports.createAsaasPayment = functions.https.onCall(async (data, context) => {
    // 1. Validar Autenticação
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'O usuário deve estar logado.');
    }

    const { courseId } = data;
    const userId = context.auth.uid;

    try {
        // 2. Buscar dados do Curso e do Usuário
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const userDoc = await db.collection('users').doc(userId).get();

        if (!courseDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Curso não encontrado.');
        }

        const course = courseDoc.data();
        const user = userDoc.data();

        // 3. Criar ou recuperar cliente no Asaas
        let customerId;
        try {
            const customerResponse = await axios.post(`${ASAAS_URL}/customers`, {
                name: user.name,
                email: user.email,
                externalReference: userId
            }, {
                headers: { access_token: ASAAS_API_KEY }
            });
            customerId = customerResponse.data.id;
        } catch (error) {
             const searchCustomer = await axios.get(`${ASAAS_URL}/customers?email=${user.email}`, {
                headers: { access_token: ASAAS_API_KEY }
             });
             if(searchCustomer.data.data.length > 0) {
                 customerId = searchCustomer.data.data[0].id;
             } else {
                 throw new functions.https.HttpsError('internal', 'Erro ao criar cliente no Asaas.');
             }
        }

        // 4. Criar Cobrança no Asaas
        const paymentResponse = await axios.post(`${ASAAS_URL}/payments`, {
            customer: customerId,
            billingType: 'UNDEFINED',
            value: course.price,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `Curso: ${course.title}`,
            externalReference: JSON.stringify({ userId, courseId })
        }, {
             headers: { access_token: ASAAS_API_KEY }
        });

        const paymentData = paymentResponse.data;

        // 5. Salvar intenção de pagamento no Firestore
        await db.collection('payments').doc(paymentData.id).set({
            userId: userId,
            courseId: courseId,
            amount: course.price,
            status: 'PENDING',
            invoiceUrl: paymentData.invoiceUrl,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            paymentUrl: paymentData.invoiceUrl,
            paymentId: paymentData.id
        };

    } catch (error) {
        console.error("Erro ao criar pagamento:", error);
        throw new functions.https.HttpsError('internal', 'Falha ao processar pagamento.', error.message);
    }
});

/**
 * Webhook para receber notificações do Asaas.
 */
exports.handleAsaasWebhook = functions.https.onRequest(async (req, res) => {
    const event = req.body;
    
    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
        const paymentData = event.payment;
        const paymentId = paymentData.id;

        try {
            const paymentRef = db.collection('payments').doc(paymentId);
            await paymentRef.update({
                status: 'CONFIRMED',
                confirmedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            const paymentDoc = await paymentRef.get();
            if (paymentDoc.exists) {
                const { userId, courseId, amount } = paymentDoc.data();

                const userRef = db.collection('users').doc(userId);
                await userRef.update({
                    enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId)
                });

                const courseRef = db.collection('courses').doc(courseId);
                await courseRef.update({
                    totalStudents: admin.firestore.FieldValue.increment(1),
                    totalRevenue: admin.firestore.FieldValue.increment(amount)
                });
                
                console.log(`Usuário ${userId} matriculado via Webhook.`);
            }

        } catch (error) {
            console.error("Erro ao processar Webhook:", error);
            return res.status(500).send("Erro interno ao processar webhook.");
        }
    }

    res.status(200).json({ received: true });
});
