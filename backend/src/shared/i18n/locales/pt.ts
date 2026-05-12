export const pt = {
    auth: {
        invalidCredentials: "Credenciais inválidas",
        userAlreadyExists: "Usuário já existe",
        userNotFound: "Usuário não encontrado",
        invalidOrExpiredCode: "Código de verificação inválido ou expirado.",
        invalidOrExpiredToken: "Token temporário inválido ou expirado",
        invalidTokenStructure: "Estrutura do token temporário inválida",
        invalid2FACode: "Código 2FA inválido",
    },

    user: {
        notFound: "Usuário não encontrado",
        twoFactorAlreadyActive: "2FA já está ativo. Desative primeiro para reconfigurar.",
        currentPasswordRequired: "Senha atual é obrigatória para alterar a senha existente",
        currentPasswordIncorrect: "Senha atual incorreta",
        configNotFound: "Configuração do usuário não encontrada",
    },

    company: {
        notFound: "Empresa não encontrada",
        forbidden: "Acesso negado",
        nameAlreadyExists: "Uma empresa com nome semelhante já existe",
        limitReached: "Limite de empresas atingido. O plano {planName} permite até {maxCompanies} empresa(s). Faça upgrade do seu plano.",
        configNotFound: "Configuração da empresa não encontrada",
    },

    bot: {
        whatsappRequired: "É necessário configurar o número de WhatsApp da empresa antes de ativar o bot.",
        descriptionRequired: "É necessário preencher a descrição do negócio antes de ativar o bot.",
        defaultGreeting: "Olá! 👋 Seja bem-vindo(a)! Como posso ajudá-lo(a) hoje?",
        defaultInstructions: "Seja cordial e atencioso. Ajude o cliente com informações sobre serviços, horários e agendamentos.",
    },

    professional: {
        notFound: "Profissional não encontrado",
    },

    appointment: {
        noPending: "Nenhum agendamento pendente encontrado para este cliente",
    },

    subscription: {
        notFound: "Nenhuma assinatura encontrada.",
        notCancellable: "A assinatura não está em um estado cancelável.",
        alreadyActive: "Usuário já possui uma assinatura ativa.",
        noPlan: "Nenhum plano disponível para compra.",
        noCompany: "Usuário não possui empresa configurada.",
        missingBillingInfo: "É necessário configurar o número de WhatsApp e CPF/CNPJ antes do checkout.",
        paymentNotFound: "Pagamento não encontrado",
    },

    error: {
        internal: "Erro interno do servidor",
        companyNotSelected: "Empresa não selecionada",
        validationFailed: "Falha na validação",
    },
};
