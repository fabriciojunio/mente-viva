# 🔐 Política de Segurança

## Reportar Vulnerabilidades

Se você encontrar uma vulnerabilidade de segurança no Mente Viva, por favor **NÃO abra uma issue pública**.

Envie um email para: **security@menteviva.app**

Inclua:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- (opcional) Sugestão de correção

**Prazo de resposta:** 72 horas  
**Prazo de correção:** 15 dias para vulnerabilidades críticas

---

## Controles de Segurança Implementados

### OWASP Top 10 (2021)

| # | Risco | Status | Implementação |
|---|-------|--------|--------------|
| A01 | Broken Access Control | ✅ Mitigado | UUID validation, rate limiting |
| A02 | Cryptographic Failures | ✅ Mitigado | HTTPS/HSTS, sem dados sensíveis em logs |
| A03 | Injection | ✅ Mitigado | Sem SQL; inputs validados com whitelist |
| A04 | Insecure Design | ✅ Mitigado | Clean Architecture, Result type |
| A05 | Security Misconfiguration | ✅ Mitigado | Helmet, CORS whitelist, headers seguros |
| A06 | Vulnerable Components | ✅ Mitigado | Sem native deps vulneráveis; npm audit |
| A07 | Auth Failures | ✅ Mitigado | Rate limiting em criação de perfis |
| A08 | Software Integrity | ✅ Mitigado | npm ci, lock files |
| A09 | Security Logging | ✅ Mitigado | Audit trail completo; logs redactados |
| A10 | SSRF | ✅ N/A | Sem chamadas a URLs externas do backend |

---

## Headers HTTP de Segurança

```
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Powered-By: (removido)
```

---

## Rate Limiting

- **Global:** 200 req / 15 minutos por IP
- **Criação de perfis:** 20 req / 15 minutos por IP
- **Resposta de limite:** HTTP 429 com mensagem em português

---

## Validação de Entrada

Todos os inputs são validados antes de qualquer processamento:
- Nomes: apenas letras, espaços, acentos, apóstrofes e hífens (regex Unicode)
- IDs: formato UUID v4 obrigatório
- Scores: número entre 0 e 9999
- Jogos e níveis: whitelist estrita de valores permitidos
- Body size: máximo 100kb

---

## Dados Nunca Logados

```javascript
// Campos automaticamente redactados em logs:
['password', 'token', 'authorization', 'cookie', 
 'secret', 'cpf', 'creditCard', 'passwordHash']
```
