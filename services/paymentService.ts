
import { getFunctions, httpsCallable } from 'firebase/functions';
import { enrollUserInCourse } from './mockBackend'; // Fallback para demo
import { app } from './firebase';

/**
 * Inicia o processo de pagamento chamando a Cloud Function.
 * @param courseId ID do curso
 * @param userId ID do usuário
 * @returns URL de pagamento do Asaas
 */
export const initiatePayment = async (courseId: string, userId: string): Promise<string> => {
    
    // --- MODO DEMONSTRAÇÃO (SIMULAÇÃO) ---
    // Como não temos um backend real rodando neste ambiente de navegador,
    // simularemos a resposta que a Cloud Function daria.
    // Em produção, remova este bloco e use o bloco 'REAL' abaixo.
    
    console.log("SIMULAÇÃO: Chamando Cloud Function 'createAsaasPayment'...");
    
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulando uma URL de invoice do Asaas
            // Em um app real, o webhook do Asaas chamaria o backend para liberar o curso.
            // Aqui, vamos simular que o pagamento foi "aprovado" imediatamente para UX.
            resolve(`https://sandbox.asaas.com/i/${Math.random().toString(36).substring(7)}`);
        }, 1500);
    });

    // --- CÓDIGO REAL PARA PRODUÇÃO ---
    /*
    const functions = getFunctions(app);
    const createAsaasPayment = httpsCallable(functions, 'createAsaasPayment');
    
    try {
        const result = await createAsaasPayment({ courseId });
        const data = result.data as { paymentUrl: string, paymentId: string };
        return data.paymentUrl;
    } catch (error) {
        console.error("Erro na função de pagamento:", error);
        throw error;
    }
    */
};

/**
 * Simula o Webhook do Asaas para liberar o curso no ambiente de demonstração.
 * Em produção, isso não existiria no frontend; seria automático via Webhook do Backend.
 */
export const mockWebhookSuccess = async (userId: string, courseId: string) => {
    console.log("SIMULAÇÃO: Webhook de pagamento confirmado recebido.");
    await enrollUserInCourse(userId, courseId);
};
