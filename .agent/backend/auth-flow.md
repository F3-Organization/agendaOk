# Fluxo de Autenticação - ConfirmaZap

O ConfirmaZap utiliza um sistema de autenticação dual que suporta tanto o login tradicional (Email e Senha) quanto o Login Social (Google OAuth2).

## 1. Login com Google (Fluxo OAuth2)

O fluxo de autenticação com o Google segue o padrão **Authorization Code Flow** com troca de tokens no servidor:

1.  **Início (Backend)**: O usuário clica em "Log in with Google". O frontend redireciona para `GET /api/auth/google`.
2.  **Consentimento (Google)**: O backend gera a URL de autorização do Google com o `GOOGLE_REDIRECT_URI` configurado (ex: `http://localhost:5173/auth/google/callback`).
3.  **Redirecionamento para o Frontend**: Após o consentimento, o Google redireciona o usuário para o **Frontend** com um parâmetro `?code=...`.
4.  **Troca de Código (Frontend p/ Backend)**: A página `GoogleCallbackPage` captura o `code` e chama `GET /api/auth/google/callback?code=...`.
5.  **Geração do Token (Backend)**:
    - O backend troca o código pelos tokens de acesso e refresh via `GoogleCalendarAdapter`.
    - Recupera o perfil do usuário (ID, Email, Nome).
    - Cria ou recupera o usuário no banco de dados.
    - Armazena as credenciais do Google (Tokens e Refresh Token) na tabela `user_configs`.
    - Retorna um **JWT** e os dados do usuário para o frontend.

> [!IMPORTANT]
> **Single-use Code**: O código de autorização do Google só pode ser usado uma vez. Para evitar o erro `invalid_grant` em desenvolvimento (causado pelo Strict Mode do React que executa o `useEffect` duas vezes), implementamos um `useRef` guard na `GoogleCallbackPage`.

---

## 2. Login com Email e Senha (Tradicional)

1.  **Registro**: O usuário envia nome, email e senha. A senha é criptografada utilizando **bcrypt** com 10 rounds.
2.  **Autenticação**: O backend valida o hash da senha enviada contra o valor armazenado no banco.
3.  **Sessão**: Se válido, o backend assina um JWT contendo o ID, email e papel (role) do usuário.

---

## 3. Gestão de Sessão (JWT)

- **Armazenamento**: O frontend armazena o JWT no `localStorage`.
- **Cabeçalho**: Todas as requisições para rotas protegidas devem incluir o header `Authorization: Bearer <TOKEN>`.
- **Validação**: O `FastifyAdapter` utiliza o plugin `@fastify/jwt` para verificar a validade do token e as permissões do usuário em cada requisição protegida.

---

## 4. Middleware de Assinatura (Subscription)

Algumas ações síncronas ou de automação exigem uma assinatura ativa:
- O `subscriptionMiddleware` intercepta a requisição, busca o registro na tabela `subscriptions` e bloqueia o acesso com um **403 Forbidden** caso o usuário não tenha um plano ativo.
