# 🔒 LGPD — Lei Geral de Proteção de Dados

Este documento descreve como o **Mente Viva** trata os dados pessoais dos usuários, em conformidade com a Lei nº 13.709/2018 (LGPD).

---

## 📋 Inventário de Dados Pessoais

| Dado | Finalidade | Base Legal | Retenção |
|------|-----------|-----------|---------|
| Nome do jogador | Personalização da experiência | Consentimento (Art. 7º, I) | Duração do uso + 5 anos |
| Data de nascimento (opcional) | Mensagem de aniversário | Consentimento (Art. 7º, I) | Duração do uso + 5 anos |
| Histórico de partidas | Cálculo de progressão e estatísticas | Legítimo interesse (Art. 7º, IX) | Duração do uso + 5 anos |
| Conquistas desbloqueadas | Gamificação e motivação | Legítimo interesse (Art. 7º, IX) | Duração do uso |
| Logs de auditoria (IP, user-agent) | Segurança e detecção de fraudes | Legítimo interesse (Art. 7º, IX) | 6 meses |
| Fila offline | Sincronização de dados | Execução de contrato (Art. 7º, V) | Até sincronização |

---

## 🎯 Direitos dos Titulares (Art. 18 LGPD)

### Acesso aos dados
```
GET /api/v1/players/:id
GET /api/v1/privacy/:id/audit
```
Retorna todos os dados armazenados sobre o usuário.

### Portabilidade (exportação)
```
GET /api/v1/privacy/:id/export
```
Exporta todos os dados em formato JSON estruturado.

### Solicitação de exclusão
```
POST /api/v1/privacy/:id/deletion
```
Cria uma solicitação formal com número de protocolo.  
**SLA:** Processamento em até **15 dias úteis**.

### Eliminação (exclusão de conta)
```
DELETE /api/v1/players/:id
```
Soft delete imediato. Hard delete após período de retenção legal.

### Revogação do consentimento
Disponível através da função "Sair da Conta" no perfil do aplicativo.

---

## 🗑️ Política de Retenção e Eliminação

| Categoria | Retenção | Método |
|-----------|---------|--------|
| Perfil do usuário | Duração do uso + 5 anos | Soft delete → Hard delete |
| Histórico de partidas | Duração do uso + 5 anos | Soft delete → Hard delete |
| Logs de auditoria | 5 anos (Art. 37 LGPD) | Arquivamento |
| Logs de IP | 6 meses | Exclusão automática |
| Dados de sincronização offline | Até sincronizar | Exclusão imediata |

**Soft delete:** Quando o usuário remove a conta, os dados são marcados como excluídos mas preservados para obrigações legais. Após o período de retenção, são eliminados definitivamente.

---

## 🛡️ Medidas de Segurança Técnicas

- **Criptografia em trânsito:** HTTPS obrigatório em produção (HSTS habilitado)
- **Armazenamento local:** AsyncStorage (dados ficam no dispositivo do usuário)
- **Redação de dados:** Logs automaticamente redactam passwords, tokens e dados pessoais
- **Rate limiting:** Proteção contra scraping em massa de dados
- **Autenticação:** IDs UUIDs v4 únicos por sessão
- **Validação de entrada:** Todos os inputs são validados antes de armazenamento
- **Headers de segurança:** Content-Security-Policy, X-Frame-Options: DENY, etc.

---

## 📬 Contato do DPO

**Encarregado de Proteção de Dados (DPO):**  
Email: dpo@menteviva.app  
Prazo de resposta: 15 dias úteis (Art. 41 LGPD)

---

## 🚨 Notificação de Incidentes

Em caso de incidente de segurança com dados pessoais:
- **ANPD:** Notificação em até 72 horas (Art. 48 LGPD)
- **Titulares afetados:** Notificação em prazo razoável
- **Canal:** security@menteviva.app

---

## 📍 Localização dos Dados

Os dados são armazenados:
1. **No dispositivo do usuário** (AsyncStorage — primário, offline-first)
2. **No servidor da aplicação** (banco de dados JSON — sincronização)

Não há transferência internacional de dados.

---

## 🔄 Atualizações desta Política

Esta política pode ser atualizada periodicamente. O usuário será notificado sobre mudanças significativas através do aplicativo.

**Última atualização:** Maio de 2026  
**Versão:** 1.0
