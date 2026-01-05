const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// Configuração do Asaas (Recomenda-se usar environment variables futuramente)
const ASAAS_API_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmIyNDliNTViLThlYTAtNDRiOC1hNGJiLThmNGIxN2NmOGE0Zjo6JGFhY2hfNDI3OGNiMzMtYjMxNi00MDQ5LWI0OTctMTRmZmE4ZjBjZjYx';
const ASAAS_URL = 'https://sandbox.asaas.com/api/v3';

/**
 * Retorna as opções de métodos de pagamento disponíveis
 */
exports.getPaymentMethods = functions.https.onCall(async (data, context) => {
    return {
        methods: [
            {
                id: 'PIX',
                name: 'Pix',
                description: 'Pagamento instantâneo via Pix',
                icon: '📱',
                processingTime: 'Imediato',
                fees: 'Sem taxa'
            },
            {
                id: 'BOLETO',
                name: 'Boleto Bancário',
                description: 'Pague em qualquer banco',
                icon: '🏦',
                processingTime: '1-3 dias úteis',
                fees: 'Sem taxa'
            },
            {
                id: 'CREDIT_CARD',
                name: 'Cartão de Crédito',
                description: 'À vista ou parcelado em até 12x',
                icon: '💳',
                processingTime: 'Imediato',
                fees: 'Sem taxa'
            }
        ]
    };
});

/**
 * Cria um Link de Pagamento de acordo com o método escolhido no Frontend
 */
exports.createAsaasPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'O usuário deve estar logado.');
    }

    const { courseId, billingType, installments } = data;
    const userId = context.auth.uid;

    // Validar tipo de pagamento
    const validBillingTypes = ['PIX', 'BOLETO', 'CREDIT_CARD'];
    if (!validBillingTypes.includes(billingType)) {
        throw new functions.https.HttpsError('invalid-argument', `Tipo de pagamento inválido. Use: ${validBillingTypes.join(', ')}`);
    }

    try {
        const courseDoc = await db.collection('courses').doc(courseId).get();
        const userDoc = await db.collection('users').doc(userId).get();

        if (!courseDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Curso não encontrado.');
        }

        const course = courseDoc.data();
        const user = userDoc.data();

        if (!user.cpfCnpj) {
            throw new functions.https.HttpsError('invalid-argument', 'CPF ou CNPJ não encontrado no perfil do usuário.');
        }

        // 1. Criar ou recuperar cliente
        let customerId;
        const sanitizedCpf = user.cpfCnpj ? user.cpfCnpj.replace(/\D/g, '') : '';

        try {
            const customerResponse = await axios.post(`${ASAAS_URL}/customers`, {
                name: user.name,
                email: user.email,
                cpfCnpj: sanitizedCpf,
                externalReference: userId
            }, { headers: { access_token: ASAAS_API_KEY } });
            customerId = customerResponse.data.id;
        } catch (error) {
            const searchCustomer = await axios.get(`${ASAAS_URL}/customers?email=${user.email}`, {
                headers: { access_token: ASAAS_API_KEY }
            });
            if (searchCustomer.data.data.length > 0) {
                customerId = searchCustomer.data.data[0].id;
            } else {
                throw new Error('Erro ao processar cliente: ' + error.message);
            }
        }

        // 2. Preparar payload de pagamento baseado no tipo escolhido
        const paymentPayload = {
            customer: customerId,
            billingType: billingType,
            value: course.price,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `Acesso ao curso: ${course.title}`,
            externalReference: JSON.stringify({ userId, courseId })
        };

        // 3. Para cartão de crédito, adicionar parcelamento
        if (billingType === 'CREDIT_CARD' && installments) {
            const installmentCount = Math.min(Math.max(parseInt(installments) || 1, 1), 12);
            paymentPayload.installmentCount = installmentCount;
            paymentPayload.installmentValue = parseFloat((course.price / installmentCount).toFixed(2));
        }

        // 4. Criar cobrança
        const paymentResponse = await axios.post(`${ASAAS_URL}/payments`, paymentPayload, {
            headers: { access_token: ASAAS_API_KEY }
        });

        const paymentData = paymentResponse.data;

        // 5. Salvar registro pendente
        await db.collection('payments').doc(paymentData.id).set({
            userId,
            courseId,
            amount: course.price,
            billingType: billingType,
            installments: billingType === 'CREDIT_CARD' ? (Math.min(Math.max(parseInt(installments) || 1, 1), 12)) : 1,
            status: 'PENDING',
            invoiceUrl: paymentData.invoiceUrl,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
            paymentUrl: paymentData.invoiceUrl,
            paymentId: paymentData.id,
            billingType: billingType
        };

    } catch (error) {
        console.error("Erro ao criar pagamento Asaas:", error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', 'Falha ao processar pagamento.');
    }
});

/**
 * Webhook atualizado para processar pagamentos vindos de Links.
 */
exports.handleAsaasWebhook = functions.https.onRequest(async (req, res) => {
    const event = req.body;
    
    if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
        const paymentData = event.payment;
        
        try {
            // Extrai as referências do campo que enviamos na criação do link
            const { userId, courseId } = JSON.parse(paymentData.externalReference);

            // 1. Atualiza status do pagamento
            await db.collection('payments').doc(paymentData.id).set({
                userId,
                courseId,
                status: 'CONFIRMED',
                billingType: paymentData.billingType,
                confirmedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // 2. Libera o curso para o usuário
            await db.collection('users').doc(userId).update({
                enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId)
            });

            // 3. Atualiza estatísticas do curso
            await db.collection('courses').doc(courseId).update({
                totalStudents: admin.firestore.FieldValue.increment(1),
                totalRevenue: admin.firestore.FieldValue.increment(paymentData.value)
            });

            console.log(`Sucesso: Curso ${courseId} liberado para ${userId}`);
        } catch (error) {
            console.error("Erro no processamento do webhook:", error);
        }
    }
    res.status(200).json({ received: true });
});