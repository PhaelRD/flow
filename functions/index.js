
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const axios = require('axios');

initializeApp();
const db = getFirestore();

const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjJmODU0ZmZmLWYyNmQtNDY5Mi1hYjIwLTMwMzhjZmJkNTUwNzo6JGFhY2hfZjc0NWI1MWMtMGYwZS00MzA0LThhZWMtYzk1Mjg3MmYzMWUz';
const ASAAS_URL = 'https://sandbox.asaas.com/api/v3';

exports.getPaymentMethods = onCall(async (request) => {
    return {
        methods: [
            { id: 'PIX', name: 'Pix', description: 'Instantâneo', icon: '📱', processingTime: 'Imediato', fees: 'Grátis' },
            { id: 'BOLETO', name: 'Boleto', description: 'Compensação bancária', icon: '🏦', processingTime: '1-3 dias', fees: 'Grátis' },
            { id: 'CREDIT_CARD', name: 'Cartão', description: 'Até 12x', icon: '💳', processingTime: 'Imediato', fees: 'Grátis' }
        ]
    };
});

exports.createAsaasPayment = onCall(async (request) => {
    const { data, auth } = request;
    
    // Log para depuração de auth (visto nos logs do Firebase Console)
    console.log("Recebendo chamada createAsaasPayment. Auth context:", !!auth);

    if (!auth) {
        throw new HttpsError('unauthenticated', 'O usuário deve estar logado no sistema Habilon.');
    }

    const { courseId, billingType, installments } = data;
    const userId = auth.uid;

    if (!courseId || !billingType) {
        throw new HttpsError('invalid-argument', 'Parâmetros courseId e billingType são obrigatórios.');
    }

    try {
        const [courseDoc, userDoc] = await Promise.all([
            db.collection('courses').doc(courseId).get(),
            db.collection('users').doc(userId).get()
        ]);

        if (!courseDoc.exists) throw new HttpsError('not-found', 'Curso não encontrado.');
        if (!userDoc.exists) throw new HttpsError('not-found', 'Perfil do usuário não encontrado.');

        const course = courseDoc.data();
        const user = userDoc.data();

        // Fallback para CPF se necessário (ou validação)
        const sanitizedCpf = (user.cpfCnpj || '').replace(/\D/g, '');
        if (!sanitizedCpf) {
            throw new HttpsError('invalid-argument', 'Complete seu CPF/CNPJ no perfil antes de comprar.');
        }

        // 1. Cliente Asaas
        let customerId;
        try {
            const customerResponse = await axios.post(`${ASAAS_URL}/customers`, {
                name: user.name,
                email: user.email,
                cpfCnpj: sanitizedCpf,
                externalReference: userId
            }, { headers: { access_token: ASAAS_API_KEY } });
            customerId = customerResponse.data.id;
        } catch (err) {
            const search = await axios.get(`${ASAAS_URL}/customers?email=${user.email}`, {
                headers: { access_token: ASAAS_API_KEY }
            });
            if (search.data.data.length > 0) customerId = search.data.data[0].id;
            else throw new Error('Falha ao criar/localizar cliente no Asaas.');
        }

        // 2. Payload da Cobrança
        const paymentPayload = {
            customer: customerId,
            billingType: billingType,
            value: course.price,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `Curso: ${course.title}`,
            externalReference: JSON.stringify({ userId, courseId })
        };

        if (billingType === 'CREDIT_CARD') {
            const count = Math.min(Math.max(parseInt(installments) || 1, 1), 12);
            paymentPayload.installmentCount = count;
            paymentPayload.installmentValue = parseFloat((course.price / count).toFixed(2));
        }

        // 3. Execução
        const paymentResponse = await axios.post(`${ASAAS_URL}/payments`, paymentPayload, {
            headers: { access_token: ASAAS_API_KEY }
        });

        const paymentData = paymentResponse.data;

        // 4. Auditoria Interna
        await db.collection('payments').doc(paymentData.id).set({
            userId,
            courseId,
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
        console.error("Erro interno createAsaasPayment:", error.response?.data || error.message);
        throw new HttpsError('internal', error.message || 'Falha ao processar pagamento.');
    }
});

exports.handleAsaasWebhook = onRequest(async (request, response) => {
    const event = request.body;
    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
        const p = event.payment;
        try {
            const { userId, courseId } = JSON.parse(p.externalReference);
            await Promise.all([
                db.collection('payments').doc(p.id).update({ status: 'CONFIRMED' }),
                db.collection('users').doc(userId).update({ enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId) }),
                db.collection('courses').doc(courseId).update({
                    totalStudents: admin.firestore.FieldValue.increment(1),
                    totalRevenue: admin.firestore.FieldValue.increment(p.value),
                    updatedAt: Date.now()
                })
            ]);
        } catch (e) { console.error("Webhook Error:", e); }
    }
    response.status(200).send('OK');
});
