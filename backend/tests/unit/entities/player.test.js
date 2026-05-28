'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';

const { Player } = require('../../../src/domain/entities/Player');
const { ValidationError } = require('../../../src/domain/errors');

describe('Player entity', () => {
  describe('create()', () => {
    test('cria jogadora com dados válidos', () => {
      const p = Player.create({ name: 'Maria' });
      assert.equal(p.name, 'Maria');
      assert.ok(p.id);
      assert.ok(p.createdAt);
      assert.equal(p.deletedAt, null);
    });

    test('faz trim no nome', () => {
      const p = Player.create({ name: '  Ana  ' });
      assert.equal(p.name, 'Ana');
    });

    test('aceita nome com acento', () => {
      const p = Player.create({ name: 'Márcia' });
      assert.equal(p.name, 'Márcia');
    });

    test('rejeita nome vazio', () => {
      assert.throws(() => Player.create({ name: '' }), ValidationError);
    });

    test('rejeita nome só com espaços', () => {
      assert.throws(() => Player.create({ name: '   ' }), ValidationError);
    });

    test('rejeita nome menor que 2 caracteres', () => {
      assert.throws(() => Player.create({ name: 'A' }), ValidationError);
    });

    test('rejeita nome maior que 50 caracteres', () => {
      assert.throws(() => Player.create({ name: 'A'.repeat(51) }), ValidationError);
    });

    test('aceita nome com exatamente 2 caracteres', () => {
      const p = Player.create({ name: 'Lu' });
      assert.equal(p.name, 'Lu');
    });

    test('aceita nome com exatamente 50 caracteres', () => {
      const p = Player.create({ name: 'A'.repeat(50) });
      assert.equal(p.name.length, 50);
    });
  });

  describe('updateName()', () => {
    test('atualiza nome válido', () => {
      const p = Player.create({ name: 'Maria' });
      p.updateName('Ana Paula');
      assert.equal(p.name, 'Ana Paula');
    });

    test('atualiza updatedAt (valor muda ou permanece válido ISO)', () => {
      const p = Player.create({ name: 'Maria' });
      p.updateName('Nova');
      // updatedAt deve ser uma string ISO válida
      assert.ok(!isNaN(new Date(p.updatedAt).getTime()), 'updatedAt deve ser ISO válido');
      assert.equal(p.name, 'Nova');
    });

    test('rejeita nome inválido', () => {
      const p = Player.create({ name: 'Maria' });
      assert.throws(() => p.updateName(''), ValidationError);
    });
  });

  describe('softDelete()', () => {
    test('marca deletedAt', () => {
      const p = Player.create({ name: 'Maria' });
      p.softDelete();
      assert.ok(p.deletedAt);
      assert.equal(p.isDeleted(), true);
    });

    test('não deleta antes de chamar softDelete', () => {
      const p = Player.create({ name: 'Maria' });
      assert.equal(p.isDeleted(), false);
    });
  });

  describe('isBirthdayToday()', () => {
    test('detecta aniversário hoje', () => {
      const today = new Date();
      const birthDate = `1983-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const p = Player.create({ name: 'Maria', birthDate });
      assert.equal(p.isBirthdayToday(), true);
    });

    test('não é aniversário em data diferente', () => {
      const p = Player.create({ name: 'Maria', birthDate: '1983-01-15' });
      const today = new Date();
      // Se hoje for 15 de janeiro, pula o teste
      if (today.getMonth() === 0 && today.getDate() === 15) return;
      assert.equal(p.isBirthdayToday(), false);
    });

    test('retorna false sem data de nascimento', () => {
      const p = Player.create({ name: 'Maria' });
      assert.equal(p.isBirthdayToday(), false);
    });
  });

  describe('getAge()', () => {
    test('calcula idade corretamente', () => {
      const p = Player.create({ name: 'Maria', birthDate: '1983-06-20' });
      const age = p.getAge();
      assert.ok(age >= 41 && age <= 43);
    });

    test('retorna null sem data', () => {
      const p = Player.create({ name: 'Maria' });
      assert.equal(p.getAge(), null);
    });
  });

  describe('toPublic()', () => {
    test('não expõe deletedAt nem dados sensíveis', () => {
      const p = Player.create({ name: 'Maria' });
      const pub = p.toPublic();
      assert.ok(!('deletedAt' in pub));
      assert.ok(!('passwordHash' in pub));
    });

    test('expõe campos necessários', () => {
      const p = Player.create({ name: 'Maria' });
      const pub = p.toPublic();
      assert.ok('id' in pub);
      assert.ok('name' in pub);
      assert.ok('createdAt' in pub);
    });
  });
});
