
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, auth } from './firebase';

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
    const functions = getFunctions(app, 'us-central1');
    const getPaymentMethodsCall = httpsCallable(functions, 'getPaymentMethods');
    
    try {
        const result = await getPaymentMethodsCall({});
        const data = result.data as { methods: PaymentMethod[] };
        return data.methods || [];
    } catch (error: any) {
        console.error("Erro ao obter métodos de pagamento:", error);
        throw new Error("Não foi possível carregar as opções de pagamento.");
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
    // Verificação robusta de estado no cliente
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error("Usuário não identificado. Por favor, faça login novamente.");
    }

    // Refresh do token para garantir que o cabeçalho Authorization seja enviado
    await currentUser.getIdToken(true);

    const functions = getFunctions(app, 'us-central1');
    const createAsaasPayment = httpsCallable(functions, 'createAsaasPayment');
    
    try {
        const payload: any = { 
            courseId, 
            billingType,
            installments: billingType === 'CREDIT_CARD' ? (installments || 1) : undefined
        };
        
        const result = await createAsaasPayment(payload);
        const data = result.data as { paymentUrl: string };
        
        if (!data || !data.paymentUrl) {
            throw new Error("Resposta do servidor inválida: URL de pagamento ausente.");
        }
        
        return data.paymentUrl;
    } catch (error: any) {
        console.error("Erro na comunicação com a Cloud Function:", error);
        
        // Mapeamento de erros amigáveis para o usuário
        if (error.code === 'unauthenticated' || error.message?.includes('401')) {
            throw new Error("Erro de autenticação: Sua sessão pode ter expirado. Tente sair e entrar novamente.");
        }
        
        if (error.code === 'invalid-argument') {
            throw new Error(`Dados inválidos: ${error.message}`);
        }

        throw new Error(error.message || "Erro interno ao processar seu pagamento. Tente novamente mais tarde.");
    }
};

export const processPayment = async (courseId: string, userId: string): Promise<boolean> => {
    console.warn("processPayment depreciado.");
    return false;
};