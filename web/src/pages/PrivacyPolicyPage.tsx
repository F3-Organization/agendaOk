import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';
import { Button } from '../shared/ui/Button';

export const PrivacyPolicyPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isPt = i18n.language === 'pt';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-pulse-gradient flex items-center justify-center shadow-lg shadow-primary-dim/20">
              <Zap className="w-5 h-5 text-primary-foreground fill-current" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter">ConfirmaZap</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isPt ? 'Voltar' : 'Back'}
          </Button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <p className="text-[10px] font-bold tracking-widest uppercase text-primary-dim mb-4">
          {isPt ? 'Última atualização: 19 de Abril de 2026' : 'Last updated: April 19, 2026'}
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">
          {t('common.privacyPolicy')}
        </h1>
        <div className="prose prose-invert prose-lg max-w-none space-y-8 text-muted-foreground leading-relaxed [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-foreground [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:mt-8 [&_h3]:mb-3 [&_strong]:text-foreground [&_ul]:space-y-2 [&_li]:pl-2">
          {isPt ? (
            <>
              <p>
                A <strong>ConfirmaZap</strong> ("nós", "nosso") opera a plataforma ConfirmaZap (o "Serviço"). 
                Esta página informa sobre nossas políticas de coleta, uso e divulgação de dados pessoais quando você usa nosso Serviço.
              </p>

              <h2>1. Dados que Coletamos</h2>
              <h3>1.1 Dados de Cadastro</h3>
              <p>Ao criar uma conta, coletamos:</p>
              <ul>
                <li>Nome completo</li>
                <li>Endereço de e-mail (via Google OAuth 2.0)</li>
                <li>Número de WhatsApp (fornecido voluntariamente)</li>
                <li>CPF/CNPJ (para emissão de notas fiscais, quando aplicável)</li>
              </ul>

              <h3>1.2 Dados de Uso do Serviço</h3>
              <ul>
                <li><strong>Dados do Google Calendar:</strong> Acessamos eventos do seu calendário para possibilitar o envio de lembretes automáticos. Não armazenamos o conteúdo dos eventos permanentemente — apenas os dados necessários para a operação (nome do participante, horário, telefone).</li>
                <li><strong>Dados do WhatsApp:</strong> Utilizamos a integração com a Evolution API para enviar mensagens automáticas. Não armazenamos o conteúdo das conversas do WhatsApp.</li>
                <li><strong>Dados do Bot IA:</strong> As conversas processadas pelo bot de inteligência artificial (Google Gemini) são mantidas temporariamente na memória (Redis) com TTL de 30 minutos para manter o contexto da conversa. Após esse período, são automaticamente deletadas. Nenhuma conversa é armazenada permanentemente.</li>
              </ul>

              <h3>1.3 Dados de Navegação</h3>
              <p>Podemos coletar informações técnicas como endereço IP, tipo de navegador, páginas visitadas e tempo de permanência para fins de análise e melhoria do serviço.</p>

              <h2>2. Como Usamos seus Dados</h2>
              <ul>
                <li>Fornecer e manter o Serviço</li>
                <li>Enviar lembretes e confirmações de agendamentos via WhatsApp</li>
                <li>Processar pagamentos e gerenciar assinaturas</li>
                <li>Processar interações com o bot de IA para autoatendimento</li>
                <li>Notificá-lo sobre alterações no Serviço</li>
                <li>Fornecer suporte ao cliente</li>
                <li>Detectar, prevenir e resolver problemas técnicos</li>
              </ul>

              <h2>3. Integrações com Terceiros</h2>
              <h3>3.1 Google (OAuth 2.0 & Calendar API)</h3>
              <p>Utilizamos o Google OAuth 2.0 para autenticação. Os tokens de acesso são armazenados de forma segura e criptografada. Acessamos apenas os escopos mínimos necessários para o funcionamento do serviço (perfil e calendário).</p>

              <h3>3.2 Evolution API (WhatsApp)</h3>
              <p>A conexão com o WhatsApp é feita através da Evolution API. Não armazenamos suas credenciais do WhatsApp. A sessão é gerenciada pela Evolution API e pode ser desconectada a qualquer momento pelo usuário.</p>

              <h3>3.3 Google Gemini (Inteligência Artificial)</h3>
              <p>Utilizamos a API do Google Gemini para processamento de linguagem natural no bot de autoatendimento. As mensagens são enviadas para a API do Google para processamento, sujeitas à <a href="https://ai.google.dev/gemini-api/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Política de Uso da API do Gemini</a>. O Google não utiliza dados enviados via API para treinar seus modelos.</p>

              <h3>3.4 Abacate Pay (Pagamentos)</h3>
              <p>Os pagamentos são processados pela Abacate Pay. Não armazenamos dados de cartão de crédito. Consulte a política de privacidade da Abacate Pay para mais informações.</p>

              <h2>4. Armazenamento e Segurança</h2>
              <ul>
                <li>Os dados são armazenados em servidores seguros com criptografia em trânsito (HTTPS/TLS) e em repouso.</li>
                <li>O acesso aos dados é restrito por autenticação JWT e isolamento multi-tenant por empresa (companyId).</li>
                <li>Senhas são armazenadas com hash seguro (bcrypt).</li>
                <li>Os tokens de autenticação OAuth são armazenados de forma criptografada no banco de dados.</li>
              </ul>

              <h2>5. Seus Direitos (LGPD)</h2>
              <p>Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
              <ul>
                <li><strong>Acesso:</strong> Solicitar uma cópia dos dados pessoais que mantemos sobre você.</li>
                <li><strong>Retificação:</strong> Corrigir dados pessoais incompletos ou incorretos.</li>
                <li><strong>Exclusão:</strong> Solicitar a exclusão dos seus dados pessoais (funcionalidade "Excluir Empresa" disponível nas configurações).</li>
                <li><strong>Portabilidade:</strong> Solicitar seus dados em formato estruturado.</li>
                <li><strong>Revogação:</strong> Revogar o consentimento a qualquer momento, desconectando as integrações.</li>
              </ul>

              <h2>6. Retenção de Dados</h2>
              <ul>
                <li><strong>Dados de conta:</strong> Mantidos enquanto a conta estiver ativa. Ao excluir a empresa, todos os dados vinculados são removidos permanentemente.</li>
                <li><strong>Dados de agendamento:</strong> Mantidos por 12 meses após a criação para fins de histórico.</li>
                <li><strong>Conversas do Bot IA:</strong> Mantidas por no máximo 30 minutos na memória temporária (Redis).</li>
                <li><strong>Dados de pagamento:</strong> Mantidos conforme exigência fiscal brasileira (5 anos).</li>
              </ul>

              <h2>7. Cookies</h2>
              <p>Utilizamos cookies essenciais para autenticação (JWT token) e preferências de idioma. Não utilizamos cookies de rastreamento de terceiros.</p>

              <h2>8. Alterações nesta Política</h2>
              <p>Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre quaisquer alterações publicando a nova versão nesta página e, em caso de mudanças significativas, por e-mail.</p>

              <h2>9. Contato</h2>
              <p>Para questões sobre esta política ou para exercer seus direitos, entre em contato:</p>
              <ul>
                <li><strong>E-mail:</strong> privacidade@confirmazap.com</li>
                <li><strong>WhatsApp:</strong> Através do canal oficial de suporte no aplicativo</li>
              </ul>
            </>
          ) : (
            <>
              <p>
                <strong>ConfirmaZap</strong> ("we", "our") operates the ConfirmaZap platform (the "Service"). 
                This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.
              </p>

              <h2>1. Data We Collect</h2>
              <h3>1.1 Registration Data</h3>
              <p>When creating an account, we collect:</p>
              <ul>
                <li>Full name</li>
                <li>Email address (via Google OAuth 2.0)</li>
                <li>WhatsApp number (voluntarily provided)</li>
                <li>Tax ID (for invoice issuance, when applicable)</li>
              </ul>

              <h3>1.2 Service Usage Data</h3>
              <ul>
                <li><strong>Google Calendar Data:</strong> We access your calendar events to enable automatic reminders. We do not permanently store event content — only the data necessary for operation (participant name, time, phone).</li>
                <li><strong>WhatsApp Data:</strong> We use the Evolution API integration to send automated messages. We do not store WhatsApp conversation content.</li>
                <li><strong>AI Bot Data:</strong> Conversations processed by the AI bot (Google Gemini) are temporarily kept in memory (Redis) with a 30-minute TTL to maintain conversation context. After this period, they are automatically deleted. No conversations are permanently stored.</li>
              </ul>

              <h3>1.3 Browsing Data</h3>
              <p>We may collect technical information such as IP address, browser type, pages visited, and time spent for analysis and service improvement.</p>

              <h2>2. How We Use Your Data</h2>
              <ul>
                <li>Provide and maintain the Service</li>
                <li>Send appointment reminders and confirmations via WhatsApp</li>
                <li>Process payments and manage subscriptions</li>
                <li>Process AI bot interactions for self-service</li>
                <li>Notify you about changes to the Service</li>
                <li>Provide customer support</li>
                <li>Detect, prevent, and resolve technical issues</li>
              </ul>

              <h2>3. Third-Party Integrations</h2>
              <h3>3.1 Google (OAuth 2.0 & Calendar API)</h3>
              <p>We use Google OAuth 2.0 for authentication. Access tokens are stored securely and encrypted. We only access the minimum scopes necessary for the service (profile and calendar).</p>

              <h3>3.2 Evolution API (WhatsApp)</h3>
              <p>WhatsApp connection is made through the Evolution API. We do not store your WhatsApp credentials. The session is managed by the Evolution API and can be disconnected at any time by the user.</p>

              <h3>3.3 Google Gemini (Artificial Intelligence)</h3>
              <p>We use the Google Gemini API for natural language processing in the self-service bot. Messages are sent to Google's API for processing, subject to the <a href="https://ai.google.dev/gemini-api/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Gemini API Terms of Use</a>. Google does not use data sent via API to train its models.</p>

              <h3>3.4 Abacate Pay (Payments)</h3>
              <p>Payments are processed by Abacate Pay. We do not store credit card data. Please refer to Abacate Pay's privacy policy for more information.</p>

              <h2>4. Storage and Security</h2>
              <ul>
                <li>Data is stored on secure servers with encryption in transit (HTTPS/TLS) and at rest.</li>
                <li>Data access is restricted by JWT authentication and multi-tenant isolation per company (companyId).</li>
                <li>Passwords are stored with secure hashing (bcrypt).</li>
                <li>OAuth authentication tokens are stored encrypted in the database.</li>
              </ul>

              <h2>5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Rectification:</strong> Correct incomplete or incorrect personal data.</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data ("Delete Company" feature available in settings).</li>
                <li><strong>Portability:</strong> Request your data in a structured format.</li>
                <li><strong>Revocation:</strong> Revoke consent at any time by disconnecting integrations.</li>
              </ul>

              <h2>6. Data Retention</h2>
              <ul>
                <li><strong>Account data:</strong> Retained while the account is active. When deleting a company, all linked data is permanently removed.</li>
                <li><strong>Appointment data:</strong> Retained for 12 months after creation for history purposes.</li>
                <li><strong>AI Bot conversations:</strong> Retained for a maximum of 30 minutes in temporary memory (Redis).</li>
                <li><strong>Payment data:</strong> Retained as required by tax regulations (5 years).</li>
              </ul>

              <h2>7. Cookies</h2>
              <p>We use essential cookies for authentication (JWT token) and language preferences. We do not use third-party tracking cookies.</p>

              <h2>8. Changes to This Policy</h2>
              <p>We may update this Privacy Policy periodically. We will notify you of any changes by posting the new version on this page and, in case of significant changes, by email.</p>

              <h2>9. Contact</h2>
              <p>For questions about this policy or to exercise your rights, contact us:</p>
              <ul>
                <li><strong>Email:</strong> privacy@confirmazap.com</li>
                <li><strong>WhatsApp:</strong> Through the official support channel in the application</li>
              </ul>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-outline-variant/30">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/40">
          <span>© 2026 ConfirmaZap.</span>
          <div className="flex gap-8">
            <button onClick={() => navigate('/privacy')} className="text-primary-dim">{t('common.privacyPolicy')}</button>
            <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">{t('common.termsOfService')}</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
