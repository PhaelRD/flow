
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

const db = admin.firestore();

// Configuração do Asaas Sandbox
const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmIyNDliNTViLThlYTAtNDRiOC1hNGJiLThmNGIxN2NmOGE0Zjo6JGFhY2hfNDI3OGNiMzMtYjMxNi00MDQ5LWI0OTctMTRmZmE4ZjBjZjYx';
const ASAAS_URL = 'https://sandbox.asaas.com/api/v3';

/**
 * Função Callable para criar uma cobrança no Asaas.
 */
exports.createAsaasPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'O usuário deve estar logado.');
    }

    const { courseId } = data;
    const userId = context.auth.uid;

    try {
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const userDoc = await db.collection('users').doc(userId).get();

        if (!courseDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Curso não encontrado.');
        }

        const course = courseDoc.data();
        const user = userDoc.data();

        // 1. Criar ou recuperar cliente no Asaas
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
                 throw new functions.https.HttpsError('internal', 'Erro ao processar cliente no Asaas.');
             }
        }

        // 2. Criar Cobrança
        const paymentResponse = await axios.post(`${ASAAS_URL}/payments`, {
            customer: customerId,
            billingType: 'UNDEFINED', // Permite que o usuário escolha no checkout (Pix, Cartão, Boleto)
            value: course.price,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `Acesso ao curso: ${course.title}`,
            externalReference: JSON.stringify({ userId, courseId })
        }, {
             headers: { access_token: ASAAS_API_KEY }
        });

        const paymentData = paymentResponse.data;

        // 3. Salvar registro pendente
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
        console.error("Erro ao criar pagamento Asaas:", error);
        throw new functions.https.HttpsError('internal', 'Falha ao processar pagamento.', error.message);
    }
});

/**
 * Webhook para receber notificações do Asaas e liberar o curso.
 */
exports.handleAsaasWebhook = functions.https.onRequest(async (req, res) => {
    const event = req.body;
    
    // Log para depuração no console do Firebase
    console.log("Evento Webhook recebido:", event.event);

    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
        const paymentData = event.payment;
        const paymentId = paymentData.id;

        try {
            const paymentRef = db.collection('payments').doc(paymentId);
            const paymentDoc = await paymentRef.get();

            if (paymentDoc.exists) {
                const { userId, courseId, amount } = paymentDoc.data();

                // Atualiza status do pagamento
                await paymentRef.update({
                    status: 'CONFIRMED',
                    confirmedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // Matricula o usuário
                const userRef = db.collection('users').doc(userId);
                await userRef.update({
                    enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId)
                });

                // Atualiza estatísticas do curso
                const courseRef = db.collection('courses').doc(courseId);
                await courseRef.update({
                    totalStudents: admin.firestore.FieldValue.increment(1),
                    totalRevenue: admin.firestore.FieldValue.increment(amount)
                });
                
                console.log(`Sucesso: Curso ${courseId} liberado para usuário ${userId}.`);
            } else {
                console.warn(`Aviso: Pagamento ${paymentId} não encontrado no Firestore.`);
            }

        } catch (error) {
            console.error("Erro crítico no processamento do webhook:", error);
            return res.status(500).send("Erro interno.");
        }
    }

    res.status(200).json({ received: true });
});
