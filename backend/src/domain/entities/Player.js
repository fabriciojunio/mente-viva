'use strict';
const { ValidationError } = require('../errors');
const { v4: uuidv4 } = require('uuid');

/**
 * Player — entidade de domínio.
 * Contém toda a lógica de negócio do jogador.
 * Não conhece Express, banco de dados, ou HTTP.
 */
/**
 * Interpreta uma data de nascimento sem depender do fuso horário.
 * `new Date('1983-07-25')` é lido como meia-noite UTC, o que desloca o dia
 * para trás em fusos negativos (Brasil e Américas). Aqui extraímos ano, mês
 * e dia diretamente da string para que o aniversário caia no dia correto.
 */
function parseBirthDate(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return null;
  const year  = Number(match[1]);
  const month = Number(match[2]);
  const day   = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

class Player {
  constructor({ id, name, createdAt, updatedAt, deletedAt = null, birthDate = null }) {
    this.id        = id;
    this.name      = name;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.deletedAt = deletedAt;
    this.birthDate = birthDate;
  }

  /** Cria um novo jogador com validação */
  static create(raw) {
    const name = (raw.name || '').trim();
    if (!name || name.length < 2 || name.length > 50) {
      throw new ValidationError('Nome deve ter entre 2 e 50 caracteres');
    }
    const now = new Date().toISOString();
    return new Player({
      id:        uuidv4(),
      name,
      birthDate: raw.birthDate || null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Atualiza nome com validação */
  updateName(newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
      throw new ValidationError('Nome deve ter entre 2 e 50 caracteres');
    }
    this.name      = trimmed;
    this.updatedAt = new Date().toISOString();
  }

  /** Soft delete — preserva dados para LGPD */
  softDelete() {
    this.deletedAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  isDeleted() { return this.deletedAt !== null; }

  /** Calcula a idade a partir da data de nascimento */
  getAge() {
    const birth = parseBirthDate(this.birthDate);
    if (!birth) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.year;
    const m = (today.getMonth() + 1) - birth.month;
    if (m < 0 || (m === 0 && today.getDate() < birth.day)) age--;
    return age;
  }

  /** Verifica se é aniversário hoje */
  isBirthdayToday() {
    const birth = parseBirthDate(this.birthDate);
    if (!birth) return false;
    const today = new Date();
    return (today.getMonth() + 1) === birth.month && today.getDate() === birth.day;
  }

  /** Serialização pública — nunca expõe dados sensíveis */
  toPublic() {
    return {
      id:        this.id,
      name:      this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      age:       this.getAge(),
      isBirthday:this.isBirthdayToday(),
    };
  }
}

module.exports = { Player };
