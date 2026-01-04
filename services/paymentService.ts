
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

/**
 * Inicia o pagamento real via Cloud Functions + Asaas.
 * Retorna a URL de checkout para a qual o usuário deve ser redirecionado.
 */
export const initiateAsaasPayment = async (courseId: string): Promise<string> => {
    const functions = getFunctions(app);
    // Chamada para a função definida no Firebase Functions
    const createAsaasPayment = httpsCallable(functions, 'createAsaasPayment');
    
    try {
        const result = await createAsaasPayment({ courseId });
        const data = result.data as { paymentUrl: string };
        
        if (!data.paymentUrl) {
            throw new Error("URL de pagamento não recebida do servidor.");
        }
        
        return data.paymentUrl;
    } catch (error: any) {
        console.error("Erro ao processar pagamento Asaas:", error);
        throw new Error(error.message || "Erro ao gerar link de pagamento.");
    }
};

/**
 * Função mock para compatibilidade legada se necessário, 
 * mas o fluxo principal agora deve ser o initiateAsaasPayment.
 */
export const processPayment = async (courseId: string, userId: string): Promise<boolean> => {
    console.warn("processPayment está obsoleto. Use initiateAsaasPayment para fluxo Asaas.");
    return false;
};
