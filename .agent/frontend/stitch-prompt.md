[🏠 Voltar ao Contexto](../CONTEXT.md)

# Stitch Premium Design Prompt (ConfirmaZap)

Utilize este prompt no **Stitch** para gerar uma UI de alta fidelidade que herda toda a inteligência do nosso backend e as diretrizes de arquitetura sênior estabelecidas.

## 🛠 Contexto Técnico
- **Stack**: React (Vite) + Tailwind CSS + shadcn/ui.
- **Domínio**: `confirmazap.com`
- **Estética**: Minimalismo Profissional (estilo Calendly/Docway), Light Mode nativo, Cards limpos, Sombras sutis.

## 📝 Prompt para o Stitch

> "Aja como um Senior Product Designer. Crie uma interface SaaS para o 'ConfirmaZap', uma plataforma multi-tenant de bot de autoatendimento via WhatsApp para profissionais de saúde, estética e serviços.
>
> **Identidade Visual**:
> - Light Mode como padrão (fundo branco/#f8fafc, texto escuro #0f172a)
> - Cor primária: Azul profissional (#1d4ed8) — transmite confiança e seriedade
> - Cor secundária: Verde (#16a34a) — associação com WhatsApp e confirmações de sucesso
> - Cards brancos com sombras sutis (sem glassmorphism, sem glow)
> - Tipografia Inter — limpa e legível
> - Tons de cinza slate para superfícies e bordas
>
> **Diretrizes de Layout**:
> 1. **Sidebar**: Navegação limpa com ícones e labels (Dashboard, Conversas, Agendamentos, Bot IA, WhatsApp, Assinatura, Empresa, Configurações).
> 2. **Header**: Badge de status da instância WhatsApp (Conectado/Desconectado) e indicador do plano (FREE/PRO).
> 3. **Dashboard Principal**:
>    - **Estatísticas**: Cards brancos com bordas sutis (Mensagens enviadas, Agendamentos confirmados, Taxa de resposta, Economias de tempo).
>    - **Tabela de Agendamentos**: Lista com badges de status coloridos. Filtros por período e busca por nome/telefone.
>    - **Atividade recente**: Feed de conversas do bot.
> 4. **Página Bot IA**: Central de configuração do bot com campos para: tom de voz, serviços oferecidos, horários de atendimento. Preview de conversa ao vivo.
> 5. **Página WhatsApp**: Central de pairing com QR Code, status de conexão em tempo real e dicas de troubleshooting.
> 6. **Upgrade PRO**: Banner claro de upsell para contas FREE destacando: 3 empresas, bot IA, mensagens ilimitadas.
>
> **Estilo Visual**: Use escala de cinzas slate (slate-50 a slate-900), bordas sutis (slate-200), sombras discretas (shadow-sm/shadow-md), tipografia Inter. Cores de destaque: Azul (#1d4ed8) para ações primárias e Verde (#16a34a) para confirmações. O design deve transmitir confiança, profissionalismo e facilidade de uso para médicos, esteticistas e prestadores de serviço."

---

## Documentos Relacionados
- [Arquitetura Frontend](./architecture.md)
- [Contexto Geral](../CONTEXT.md)
