
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

export interface PaymentMethod {
    id: string;
    name: string;
    description: string;
    icon: string;
    processingTime: string;
    fees: string;
}

/**
 * Obtém as opções de métodos de pagamento disponíveis
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    const functions = getFunctions(app);
    const getPaymentMethodsCall = httpsCallable(functions, 'getPaymentMethods');
    
    try {
        const result = await getPaymentMethodsCall({});
        const data = result.data as { methods: PaymentMethod[] };
        return data.methods;
    } catch (error: any) {
        console.error("Erro ao obter métodos de pagamento:", error);
        throw new Error(error.message || "Erro ao carregar opções de pagamento.");
    }
};

/**
 * Inicia o pagamento com método de pagamento específico
 */
export const initiateAsaasPayment = async (
    courseId: string,
    billingType: string,
    installments?: number
): Promise<string> => {
    const functions = getFunctions(app);
    const createAsaasPayment = httpsCallable(functions, 'createAsaasPayment');
    
    try {
        const payload: any = { courseId, billingType };
        if (billingType === 'CREDIT_CARD' && installments) {
            payload.installments = installments;
        }
        
        const result = await createAsaasPayment(payload);
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
 * Função mock para compatibilidade legada se necessário
 */
export const processPayment = async (courseId: string, userId: string): Promise<boolean> => {
    console.warn("processPayment está obsoleto. Use initiateAsaasPayment para fluxo Asaas.");
    return false;
};
