'use strict';
const { ValidationError } = require('../errors');
const { v4: uuidv4 } = require('uuid');

/**
 * Player — entidade de domínio.
 * Contém toda a lógica de negócio do jogador.
 * Não conhece Express, banco de dados, ou HTTP.
 */
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
    if (!this.birthDate) return null;
    const today = new Date();
    const birth  = new Date(this.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  /** Verifica se é aniversário hoje */
  isBirthdayToday() {
    if (!this.birthDate) return false;
    const today = new Date();
    const birth  = new Date(this.birthDate);
    return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
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
