
import { enrollUserInCourse } from './mockBackend';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

/**
 * Simula a compra instantânea para fins de desenvolvimento.
 * No futuro, esta função chamará initiateAsaasPayment.
 */
export const processPayment = async (courseId: string, userId: string): Promise<boolean> => {
    console.log("Simulando processamento de pagamento interno...");
    
    // Simula um delay de rede de 1 segundo
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // Realiza a matrícula diretamente no banco (simulando o que o Webhook faria)
        await enrollUserInCourse(userId, courseId);
        return true;
    } catch (error) {
        console.error("Erro ao simular matrícula:", error);
        throw new Error("Falha na simulação de pagamento.");
    }
};

/**
 * Função preparada para o futuro: Inicia o pagamento real via Cloud Functions + Asaas.
 */
export const initiateAsaasPayment = async (courseId: string): Promise<string> => {
    const functions = getFunctions(app);
    const createAsaasPayment = httpsCallable(functions, 'createAsaasPayment');
    
    try {
        const result = await createAsaasPayment({ courseId });
        const data = result.data as { paymentUrl: string };
        return data.paymentUrl;
    } catch (error) {
        console.error("Erro ao chamar Cloud Function do Asaas:", error);
        throw error;
    }
};
