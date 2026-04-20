import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';
import { Button } from '../shared/ui/Button';

export const TermsOfServicePage = () => {
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
          {t('common.termsOfService')}
        </h1>
        <div className="prose prose-invert prose-lg max-w-none space-y-8 text-muted-foreground leading-relaxed [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-foreground [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:mt-8 [&_h3]:mb-3 [&_strong]:text-foreground [&_ul]:space-y-2 [&_li]:pl-2">
          {isPt ? (
            <>
              <p>
                Bem-vindo ao <strong>ConfirmaZap</strong>. Ao acessar e utilizar nossa plataforma, você concorda com estes Termos de Serviço. Por favor, leia-os atentamente.
              </p>

              <h2>1. Definições</h2>
              <ul>
                <li><strong>"Plataforma"</strong> — o software ConfirmaZap, incluindo site, API e integrações.</li>
                <li><strong>"Usuário"</strong> — qualquer pessoa que cria uma conta na Plataforma.</li>
                <li><strong>"Empresa"</strong> — entidade cadastrada pelo Usuário dentro da Plataforma para gestão de agendamentos.</li>
                <li><strong>"Bot IA"</strong> — o sistema de autoatendimento via inteligência artificial disponível no plano PRO.</li>
                <li><strong>"Plano Free"</strong> — plano gratuito com funcionalidades limitadas.</li>
                <li><strong>"Plano PRO"</strong> — plano pago com funcionalidades avançadas, incluindo Bot IA.</li>
              </ul>

              <h2>2. Elegibilidade e Conta</h2>
              <ul>
                <li>Você deve ter pelo menos 18 anos para usar o Serviço.</li>
                <li>Cada conta é pessoal e intransferível.</li>
                <li>Você é responsável por manter a segurança das credenciais da sua conta.</li>
                <li>Informações fornecidas devem ser verdadeiras e atualizadas.</li>
              </ul>

              <h2>3. Planos e Pagamentos</h2>
              <h3>3.1 Plano Free</h3>
              <ul>
                <li>Limite de 50 lembretes por mês.</li>
                <li>1 empresa por conta.</li>
                <li>Funcionalidades básicas de sincronização e notificação.</li>
                <li>Sem acesso ao Bot IA ou gestão de profissionais.</li>
              </ul>

              <h3>3.2 Plano PRO ($49/mês)</h3>
              <ul>
                <li>Lembretes ilimitados.</li>
                <li>Até 3 empresas por conta.</li>
                <li>Bot IA de autoatendimento via WhatsApp (powered by Google Gemini).</li>
                <li>Gestão completa de profissionais e horários.</li>
                <li>Modelos de WhatsApp personalizados.</li>
                <li>Suporte prioritário 24/7.</li>
              </ul>

              <h3>3.3 Cobrança</h3>
              <ul>
                <li>A cobrança do Plano PRO é mensal e recorrente.</li>
                <li>O pagamento é processado via Abacate Pay (PIX ou Cartão de Crédito).</li>
                <li>A assinatura é ativada imediatamente após confirmação do pagamento.</li>
                <li>Para cancelamento, o acesso permanece ativo até o final do período pago.</li>
              </ul>

              <h2>4. Uso Aceitável</h2>
              <p>Ao usar o ConfirmaZap, você concorda em <strong>NÃO</strong>:</p>
              <ul>
                <li>Enviar spam ou mensagens não solicitadas via WhatsApp.</li>
                <li>Utilizar o Bot IA para gerar conteúdo ilegal, ofensivo ou prejudicial.</li>
                <li>Tentar acessar dados de outras empresas ou usuários.</li>
                <li>Fazer engenharia reversa, descompilar ou copiar a Plataforma.</li>
                <li>Utilizar bots ou scripts automatizados para acessar a Plataforma de forma não autorizada.</li>
                <li>Violar qualquer lei aplicável, incluindo a LGPD.</li>
              </ul>

              <h2>5. Bot de Inteligência Artificial</h2>
              <h3>5.1 Natureza das Respostas</h3>
              <p>O Bot IA é uma ferramenta de <strong>auxílio</strong> ao atendimento. As respostas geradas por IA podem conter imprecisões. O ConfirmaZap <strong>não se responsabiliza</strong> por informações incorretas fornecidas pelo bot, incluindo horários, diagnósticos ou recomendações.</p>

              <h3>5.2 Supervisão Humana</h3>
              <p>O Usuário é responsável por:</p>
              <ul>
                <li>Configurar corretamente os dados da empresa, profissionais e horários.</li>
                <li>Revisar e ajustar as instruções do bot regularmente.</li>
                <li>Supervisionar os agendamentos realizados pelo bot.</li>
              </ul>

              <h3>5.3 Limites de Uso</h3>
              <p>O uso do Bot IA está sujeito aos limites de tokens da API do Google Gemini. Em casos de uso excessivo, podemos limitar temporariamente o acesso ao bot.</p>

              <h2>6. Integrações de Terceiros</h2>
              <p>O ConfirmaZap integra com serviços de terceiros (Google, Evolution API, Abacate Pay). Não somos responsáveis pela disponibilidade, funcionamento ou políticas desses serviços. Ao conectar sua conta, você aceita os termos de cada serviço integrado.</p>

              <h2>7. Propriedade Intelectual</h2>
              <ul>
                <li>A Plataforma, incluindo código, design, logotipo e marca, são propriedade exclusiva da ConfirmaZap.</li>
                <li>Os dados inseridos pelo Usuário permanecem como propriedade do Usuário.</li>
                <li>Não adquirimos direitos sobre o conteúdo dos seus agendamentos ou conversas.</li>
              </ul>

              <h2>8. Disponibilidade e SLA</h2>
              <ul>
                <li>Nos esforçamos para manter a Plataforma disponível 24/7, mas não garantimos disponibilidade ininterrupta.</li>
                <li>Manutenções programadas serão comunicadas com antecedência quando possível.</li>
                <li>Não somos responsáveis por indisponibilidades causadas por serviços de terceiros (WhatsApp, Google, etc.).</li>
              </ul>

              <h2>9. Limitação de Responsabilidade</h2>
              <p>Na máxima extensão permitida por lei:</p>
              <ul>
                <li>O ConfirmaZap é fornecido "como está" ("as is"), sem garantias de qualquer tipo.</li>
                <li>Não somos responsáveis por danos indiretos, incidentais, especiais ou consequentes.</li>
                <li>Nossa responsabilidade total é limitada ao valor pago pelo Usuário nos últimos 12 meses.</li>
                <li>Não somos responsáveis por faltas de pacientes, perda de receita ou danos causados por respostas do Bot IA.</li>
              </ul>

              <h2>10. Rescisão</h2>
              <ul>
                <li>O Usuário pode encerrar sua conta a qualquer momento, excluindo suas empresas e dados.</li>
                <li>Reservamo-nos o direito de suspender ou encerrar contas que violem estes Termos.</li>
                <li>Em caso de rescisão, o acesso aos dados será mantido por 30 dias para download, após os quais serão permanentemente excluídos.</li>
              </ul>

              <h2>11. Alterações nos Termos</h2>
              <p>Podemos modificar estes Termos a qualquer momento. Mudanças significativas serão comunicadas por e-mail e/ou notificação no aplicativo com 30 dias de antecedência. O uso continuado da Plataforma após as alterações constitui aceitação dos novos termos.</p>

              <h2>12. Lei Aplicável e Foro</h2>
              <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas serão submetidas ao foro da comarca de domicílio do Usuário, conforme previsto pelo Código de Defesa do Consumidor.</p>

              <h2>13. Contato</h2>
              <p>Para dúvidas sobre estes Termos, entre em contato:</p>
              <ul>
                <li><strong>E-mail:</strong> legal@confirmazap.com</li>
                <li><strong>WhatsApp:</strong> Canal oficial de suporte no aplicativo</li>
              </ul>
            </>
          ) : (
            <>
              <p>
                Welcome to <strong>ConfirmaZap</strong>. By accessing and using our platform, you agree to these Terms of Service. Please read them carefully.
              </p>

              <h2>1. Definitions</h2>
              <ul>
                <li><strong>"Platform"</strong> — the ConfirmaZap software, including website, API, and integrations.</li>
                <li><strong>"User"</strong> — any person who creates an account on the Platform.</li>
                <li><strong>"Company"</strong> — entity registered by the User within the Platform for appointment management.</li>
                <li><strong>"AI Bot"</strong> — the self-service system powered by artificial intelligence available on the PRO plan.</li>
                <li><strong>"Free Plan"</strong> — free plan with limited functionality.</li>
                <li><strong>"PRO Plan"</strong> — paid plan with advanced features, including AI Bot.</li>
              </ul>

              <h2>2. Eligibility and Account</h2>
              <ul>
                <li>You must be at least 18 years old to use the Service.</li>
                <li>Each account is personal and non-transferable.</li>
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>Information provided must be true and up to date.</li>
              </ul>

              <h2>3. Plans and Payments</h2>
              <h3>3.1 Free Plan</h3>
              <ul>
                <li>Limit of 50 reminders per month.</li>
                <li>1 company per account.</li>
                <li>Basic sync and notification features.</li>
                <li>No access to AI Bot or professional management.</li>
              </ul>

              <h3>3.2 PRO Plan ($49/month)</h3>
              <ul>
                <li>Unlimited reminders.</li>
                <li>Up to 3 companies per account.</li>
                <li>AI self-service bot via WhatsApp (powered by Google Gemini).</li>
                <li>Complete professional and schedule management.</li>
                <li>Custom WhatsApp templates.</li>
                <li>Priority 24/7 support.</li>
              </ul>

              <h3>3.3 Billing</h3>
              <ul>
                <li>PRO Plan billing is monthly and recurring.</li>
                <li>Payment is processed via Abacate Pay (PIX or Credit Card).</li>
                <li>The subscription is activated immediately after payment confirmation.</li>
                <li>For cancellation, access remains active until the end of the paid period.</li>
              </ul>

              <h2>4. Acceptable Use</h2>
              <p>By using ConfirmaZap, you agree <strong>NOT</strong> to:</p>
              <ul>
                <li>Send spam or unsolicited messages via WhatsApp.</li>
                <li>Use the AI Bot to generate illegal, offensive, or harmful content.</li>
                <li>Attempt to access data from other companies or users.</li>
                <li>Reverse engineer, decompile, or copy the Platform.</li>
                <li>Use automated bots or scripts to access the Platform in an unauthorized manner.</li>
                <li>Violate any applicable law.</li>
              </ul>

              <h2>5. Artificial Intelligence Bot</h2>
              <h3>5.1 Nature of Responses</h3>
              <p>The AI Bot is an <strong>assistance</strong> tool for customer service. AI-generated responses may contain inaccuracies. ConfirmaZap is <strong>not responsible</strong> for incorrect information provided by the bot, including schedules, diagnoses, or recommendations.</p>

              <h3>5.2 Human Oversight</h3>
              <p>The User is responsible for:</p>
              <ul>
                <li>Correctly configuring company data, professionals, and schedules.</li>
                <li>Regularly reviewing and adjusting bot instructions.</li>
                <li>Supervising appointments made by the bot.</li>
              </ul>

              <h3>5.3 Usage Limits</h3>
              <p>AI Bot usage is subject to Google Gemini API token limits. In cases of excessive use, we may temporarily limit bot access.</p>

              <h2>6. Third-Party Integrations</h2>
              <p>ConfirmaZap integrates with third-party services (Google, Evolution API, Abacate Pay). We are not responsible for the availability, operation, or policies of these services. By connecting your account, you accept the terms of each integrated service.</p>

              <h2>7. Intellectual Property</h2>
              <ul>
                <li>The Platform, including code, design, logo, and brand, is the exclusive property of ConfirmaZap.</li>
                <li>Data entered by the User remains the User's property.</li>
                <li>We do not acquire rights over the content of your appointments or conversations.</li>
              </ul>

              <h2>8. Availability and SLA</h2>
              <ul>
                <li>We strive to keep the Platform available 24/7, but we do not guarantee uninterrupted availability.</li>
                <li>Scheduled maintenance will be communicated in advance when possible.</li>
                <li>We are not responsible for unavailability caused by third-party services (WhatsApp, Google, etc.).</li>
              </ul>

              <h2>9. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law:</p>
              <ul>
                <li>ConfirmaZap is provided "as is", without warranties of any kind.</li>
                <li>We are not liable for indirect, incidental, special, or consequential damages.</li>
                <li>Our total liability is limited to the amount paid by the User in the last 12 months.</li>
                <li>We are not responsible for patient no-shows, revenue loss, or damages caused by AI Bot responses.</li>
              </ul>

              <h2>10. Termination</h2>
              <ul>
                <li>The User may terminate their account at any time by deleting their companies and data.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
                <li>In case of termination, data access will be maintained for 30 days for download, after which it will be permanently deleted.</li>
              </ul>

              <h2>11. Changes to Terms</h2>
              <p>We may modify these Terms at any time. Significant changes will be communicated by email and/or in-app notification with 30 days' notice. Continued use of the Platform after changes constitutes acceptance of the new terms.</p>

              <h2>12. Governing Law</h2>
              <p>These Terms are governed by the laws of the Federative Republic of Brazil. Any disputes will be submitted to the jurisdiction of the User's domicile, as provided by the Consumer Protection Code.</p>

              <h2>13. Contact</h2>
              <p>For questions about these Terms, contact us:</p>
              <ul>
                <li><strong>Email:</strong> legal@confirmazap.com</li>
                <li><strong>WhatsApp:</strong> Official support channel in the application</li>
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
            <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">{t('common.privacyPolicy')}</button>
            <button onClick={() => navigate('/terms')} className="text-primary-dim">{t('common.termsOfService')}</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
