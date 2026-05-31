# Mente Viva 🧠

**Exercícios cognitivos gratuitos para ajudar na prevenção do Alzheimer.**

Um app mobile feito com amor — para mães, avós, tias e qualquer pessoa que queira manter o cérebro ativo. Baseado em pesquisas científicas reais.

[![CI](https://github.com/fabriciojunio/mente-viva/actions/workflows/ci.yml/badge.svg)](https://github.com/fabriciojunio/mente-viva/actions)
[![Testes](https://img.shields.io/badge/testes-206%2F206%20✅-brightgreen)]()
[![LGPD](https://img.shields.io/badge/LGPD-compliant-blue)]()
[![Offline](https://img.shields.io/badge/offline--first-100%25-orange)]()
[![Licença](https://img.shields.io/badge/licença-MIT-green)]()

---

## Este projeto é para as pessoas

Mente Viva nasceu de uma necessidade real: dar para quem a gente ama uma ferramenta simples, gratuita e eficaz para treinar o cérebro todos os dias.

**Se você quiser pegar esse projeto e usar para ajudar outras pessoas — seja sua família, sua comunidade, uma ONG, um grupo de idosos — fique à vontade.** O código é MIT, totalmente aberto. Você pode usar, modificar, distribuir e até colocar sua própria identidade visual sem precisar pedir permissão.

Se quiser contribuir de volta com melhorias, será muito bem-vinda. Veja o [guia de contribuição](CONTRIBUTING.md).

---

## Por que jogar?

| Pesquisa | Resultado |
|----------|-----------|
| Estudo ACTIVE, *Alzheimer's & Dementia*, 2026 | Treino cognitivo reduz risco de Alzheimer em **25% ao longo de 20 anos** |
| University of Exeter + King's College London (19.000 participantes) | Quem faz puzzles de palavras regularmente tem cérebro **8–10 anos mais jovem** |
| McGill University, 2024 | 10 semanas de treino digital **rejuvenesce o cérebro em 10 anos** |
| Lancet Commission, 2024 | Até **45% dos casos** de demência são preveníveis |
| Rush University Medical Center | Atividade cognitiva reduz declínio de memória em **32% em 7 anos** |

---

## Os 7 jogos

| Jogo | Área do Cérebro | Como funciona |
|------|----------------|---------------|
| **Caça-Palavras** 🔍 | Linguagem + memória léxica | Encontre as palavras escondidas na grade |
| **Memória** 🎴 | Memória episódica | Vire as cartas e encontre os pares |
| **Rapidez** ⚡ | Velocidade de processamento | O emoji é igual ao anterior? |
| **Sequência** 🔢 | Atenção + memória de trabalho | Memorize e repita a ordem |
| **Cores (Stroop)** 🎨 | Atenção dividida | O nome ou a cor da palavra? |
| **Contas Rápidas** 🧮 | Raciocínio numérico | Calcule na cabeça |
| **Palavras** 📝 | Linguagem + memória semântica | Adivinhe a palavra letra por letra |

Cada jogo tem 3 níveis: **Fácil 🌱 / Normal ⭐ / Difícil 🔥**

Funciona **100% offline** — nenhum dado sai do celular.

---

## Instalar no celular (Android)

### Opção 1 — Baixar o APK pronto

> Se já existe uma release publicada neste repositório, clique em **[Releases](../../releases)** e baixe o arquivo `.apk` mais recente.

Para instalar o APK no celular:
1. Baixe o arquivo `.apk`
2. Abra as **Configurações** do Android
3. Vá em **Segurança** (ou **Privacidade**)
4. Ative **"Fontes desconhecidas"** ou **"Instalar apps de fontes desconhecidas"**
5. Toque no arquivo `.apk` baixado e siga as instruções

### Opção 2 — Gerar o APK você mesmo

Veja a seção [Gerar APK](#-gerar-apk-para-o-celular) mais abaixo.

---

## Rodar o projeto localmente

### Pré-requisitos

- [Node.js 18+](https://nodejs.org)
- [npm 9+](https://www.npmjs.com)
- Celular com Android ou iOS, ou emulador

### 1. Clonar o repositório

```bash
git clone https://github.com/fabriciojunio/mente-viva.git
cd mente-viva
```

### 2. Iniciar o backend

```bash
cd backend
npm install
npm run db:seed        # Carrega as dicas científicas
npm start              # Servidor em http://localhost:3001
```

Saída esperada:
```
[INFO] 🧠 Mente Viva Backend iniciado { port: 3001, env: 'development' }
```

### 3. Iniciar o app

```bash
cd frontend
npm install
npx expo start
```

Escaneie o QR code com o app **[Expo Go](https://expo.dev/client)** no seu celular.

> O app funciona sem o backend! Todos os dados ficam no dispositivo via AsyncStorage.

### 4. Rodar os testes

```bash
# Backend — 126 testes
cd backend
node --test tests/unit/entities/player.test.js \
     tests/unit/entities/session-achievement.test.js \
     tests/unit/use-cases/game-engine.test.js \
     tests/security/validators.test.js \
     tests/integration/api.test.js

# Frontend — 80 testes
cd frontend
node --test __tests__/gameEngine.test.js __tests__/storage.test.js
```

---

## Gerar APK para o celular

Você precisa de uma conta gratuita no [expo.dev](https://expo.dev).

### Passo 1 — Instalar o EAS CLI

```bash
npm install -g eas-cli
```

### Passo 2 — Login e configuração

```bash
cd frontend
eas login              # Entre com sua conta expo.dev
eas build:configure    # Configura o projeto (só na primeira vez)
```

### Passo 3 — Gerar o APK

```bash
eas build --platform android --profile preview
```

Aguarde cerca de 10–15 minutos. O EAS vai te enviar um link para baixar o `.apk`.

### Passo 4 — Instalar no celular

Baixe o `.apk` pelo link recebido e siga a [Opção 1](#opção-1--baixar-o-apk-pronto) acima.

---

## Estrutura do projeto

```
mente-viva/
├── backend/                          # API REST — Node.js + Express
│   └── src/
│       ├── domain/                   # Regras de negócio (sem deps externas)
│       │   ├── entities/             # Player, Session, Achievement
│       │   ├── use-cases/            # createPlayer, submitSession...
│       │   └── errors/               # AppError, ValidationError...
│       ├── infrastructure/           # Adaptadores externos
│       │   ├── database/             # Persistência JSON (sem banco externo)
│       │   ├── repositories/         # Implementações concretas
│       │   └── audit/                # Audit trail (LGPD)
│       └── application/              # Camada HTTP
│           ├── controllers/          # Handlers finos de HTTP
│           ├── middlewares/          # Validação, erros, rate limiting
│           └── routes/               # Definição das rotas
│
└── frontend/                         # React Native — Expo
    └── src/
        ├── screens/                  # Todas as telas do app
        │   ├── WordSearchGame.js     # 🔍 Caça-palavras
        │   └── GameScreens.js        # Outros 6 jogos
        ├── shared/
        │   ├── utils/gameEngine.js   # Lógica pura dos jogos (100% testável)
        │   ├── hooks/useGameTimer.js # Timer com pause/resume
        │   ├── components/           # GameHeader e componentes compartilhados
        │   └── theme/                # Cores, sombras, tipografia
        └── services/
            ├── storage.js            # AsyncStorage — offline-first
            └── api.js                # API com fallback offline automático
```

**Padrões:** Clean Architecture, Result type, Repository pattern, Dependency Injection.

---

## API REST

```
GET  /api/v1/health                    → Status do servidor
GET  /api/v1/tips                      → Dica do dia + base científica

POST /api/v1/players                   → Criar jogadora
GET  /api/v1/players/:id               → Perfil + conquistas + histórico
PUT  /api/v1/players/:id               → Atualizar nome
DELETE /api/v1/players/:id             → Remover conta (soft delete — LGPD)

POST /api/v1/sessions                  → Salvar partida
GET  /api/v1/sessions/:id              → Histórico + estatísticas

GET  /api/v1/privacy/:id/export        → Exportar dados (LGPD Art. 18)
POST /api/v1/privacy/:id/deletion      → Solicitar exclusão (LGPD)
```

---

## Variáveis de ambiente

### Backend — copie `.env.example` para `.env`

```env
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_MAX=20
```

### Frontend

```env
# .env.local
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001/api/v1
```

> `10.0.2.2` é o endereço do `localhost` dentro do emulador Android.  
> No celular físico, use o IP da sua máquina na rede local (ex: `192.168.1.10`).

---

## Segurança

- **Headers HTTP:** Helmet com CSP, HSTS, X-Frame-Options: DENY
- **CORS:** Whitelist explícita, nunca wildcard `*`
- **Rate limiting:** 200 req/15min geral; 20/15min em criação de perfis
- **Validação:** Todos os inputs validados com whitelist de valores permitidos
- **XSS:** Nome da jogadora validado com regex — apenas letras, espaços e acentos
- **Logs:** Nunca logam dados pessoais
- **LGPD:** Soft delete; exportação e deleção de dados implementadas

---

## 17 Conquistas para desbloquear

| Conquista | Como ganhar |
|-----------|-------------|
| Primeira Jogada! 🎮 | Jogar 1 vez |
| Começando Bem! 🌟 | Jogar 5 vezes |
| Veterana! 💪 | Jogar 10 vezes |
| Mestre do Jogo! 🏆 | Jogar 50 vezes |
| 2 Dias Seguidos! 🔥 | Streak de 2 dias |
| Uma Semana Inteira! 🌈 | Streak de 7 dias |
| Um Mês de Dedicação! 👑 | Streak de 30 dias |
| Exploradora! 🗺️ | Jogar todos os 7 tipos |
| Corajosa! 🦁 | Completar no nível Difícil |
| Nota 100! 🎯 | 100 pontos em uma partida |
| Caçadora de Palavras! 🔍 | 5 caças-palavras |
| Mestra das Palavras! 📚 | 20 caças-palavras |
| Feliz Aniversário! 🎂 | Jogar no dia do aniversário |

---

## Funciona offline?

**Sim, 100%.** O app usa uma estratégia offline-first:

1. Dados salvos no dispositivo via AsyncStorage
2. Jogos funcionam sem internet
3. Partidas enfileiradas localmente quando offline
4. Sincronização automática ao reconectar

---

## Como contribuir

Quer adicionar um novo jogo? Mais palavras para o caça-palavras? Suporte a outro idioma? Acesso mais fácil para idosos?

Veja o [guia de contribuição](CONTRIBUTING.md) — está detalhado e acolhedor para iniciantes.

---

## Deploy do backend (produção)

Para publicar na Play Store, o backend precisa de URL pública. Opções gratuitas:

| Serviço | Plano gratuito |
|---------|---------------|
| [Railway.app](https://railway.app) | Sim — mais fácil |
| [Render.com](https://render.com) | Sim |
| [Fly.io](https://fly.io) | Sim |

Após o deploy, edite o `frontend/eas.json`:
```json
"EXPO_PUBLIC_API_URL": "https://sua-api.railway.app/api/v1"
```

---

## Licença

MIT © 2026. Código aberto para que mais pessoas possam usar e adaptar.

Use, modifique, distribua, coloque sua marca — sem precisar pedir permissão.

---

## Base científica

- Advanced Cognitive Training for Independent and Vital Elderly (ACTIVE) Study
- University of Exeter & King's College London — 19.000 participantes
- McGill University — de Villers-Sidani Lab, 2024
- Lancet Commission on Dementia Prevention, Intervention and Care, 2024
- Rush University Medical Center — Bronx Aging Study
