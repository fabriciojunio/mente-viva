# Como Contribuir: Mente Viva 🧠

Obrigada por querer ajudar! Mente Viva é um projeto comunitário: qualquer pessoa pode contribuir para que mais gente mantenha o cérebro ativo e previna o Alzheimer.

---

## Por onde começar

1. **Leia o [README](README.md)** para entender o projeto
2. **Abra uma Issue** descrevendo o que quer fazer antes de codar
3. **Fork** o repositório e crie sua branch
4. **Abra um Pull Request** quando estiver pronto

---

## Formas de contribuir

| Tipo | Exemplos |
|------|---------|
| Novo jogo | Sudoku, palavras cruzadas, ditado de números |
| Novos idiomas | Inglês, espanhol, italiano |
| Acessibilidade | Tamanho de fonte, alto contraste, leitor de tela |
| Palavras para o caça-palavras | Mais temas de palavras em português |
| Correção de bugs | Qualquer comportamento inesperado |
| Documentação | Tradução, exemplos, screenshots |
| Testes | Aumentar cobertura dos testes existentes |

---

## Configurar o ambiente

### Pré-requisitos
- Node.js 18 ou superior
- npm 9+
- Git

### 1. Fork e clone

```bash
git clone https://github.com/fabriciojunio/mente-viva.git
cd mente-viva
```

### 2. Instalar dependências

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Rodar os testes antes de qualquer coisa

```bash
# Backend
cd backend
node --test tests/unit/entities/player.test.js \
     tests/unit/entities/session-achievement.test.js \
     tests/unit/use-cases/game-engine.test.js \
     tests/security/validators.test.js

# Frontend
cd frontend
node --test __tests__/gameEngine.test.js __tests__/storage.test.js
```

Todos os 206 testes devem passar.

---

## Padrão de commit

Usamos **Conventional Commits** em português:

```
feat: adiciona jogo de palavras cruzadas
fix: corrige timer do jogo de memória no nível difícil
perf: melhora performance do caça-palavras em grades grandes
refactor: extrai lógica de pontuação para função separada
test: adiciona testes para WordSearchEngine
docs: atualiza instruções de instalação no README
chore: atualiza dependências do expo
```

**Nunca use:** `--no-verify`, `git add .` sem revisar, commits com `console.log` no código de produção.

---

## Antes de abrir o Pull Request

- [ ] `node --test` passando no backend e no frontend
- [ ] Sem `console.log` no código de produção
- [ ] Inputs do usuário validados
- [ ] Nenhum dado sensível em logs
- [ ] Descrição clara do que mudou e por quê

---

## Adicionar novos jogos

Os jogos seguem uma estrutura consistente:

1. **Motor do jogo** em `frontend/src/shared/utils/gameEngine.js`
   - Funções puras, sem UI, sem AsyncStorage
   - `setup(level)`, `next(state)`, `calcScore(...)`, `isComplete(state)`

2. **Tela do jogo** em `frontend/src/screens/GameScreens.js`
   - Usa o motor + `useGameTimer` + `GameHeader`
   - Chama `navigation.replace('Result', {...})` ao terminar

3. **Registrar** em `frontend/App.js` e `frontend/src/shared/theme/index.js`
   - Adicionar entrada em `GAME_INFO` e `GAME_COLORS`

4. **Testes** em `frontend/__tests__/gameEngine.test.js`
   - Cobrir todos os casos do motor

---

## Código de Conduta

Este projeto é um espaço acolhedor. Seja respeitoso, paciente com iniciantes e foque em ajudar pessoas reais a manterem o cérebro saudável.

Comportamentos não aceitos: discriminação, assédio, spam.

---

Dúvidas? Abra uma [Issue](https://github.com/fabriciojunio/mente-viva/issues) e vamos ajudar! 💕
