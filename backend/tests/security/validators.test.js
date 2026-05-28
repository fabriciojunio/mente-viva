'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';

const { validatePlayerBody, validateSessionBody, validateUUID } = require('../../src/application/middlewares/validators');
const { Result } = require('../../src/utils/result');
const { logger } = require('../../src/utils/logger');

describe('validatePlayerBody()', () => {
  test('aceita nome válido',       () => assert.deepEqual(validatePlayerBody({name:'Maria'}), []));
  test('rejeita nome ausente',     () => assert.ok(validatePlayerBody({}).length > 0));
  test('rejeita nome null',        () => assert.ok(validatePlayerBody({name:null}).length > 0));
  test('rejeita nome vazio',       () => assert.ok(validatePlayerBody({name:''}).length > 0));
  test('rejeita 1 char',           () => assert.ok(validatePlayerBody({name:'A'}).length > 0));
  test('rejeita 51 chars',         () => assert.ok(validatePlayerBody({name:'A'.repeat(51)}).length > 0));
  test('aceita 2 chars',           () => assert.deepEqual(validatePlayerBody({name:'Lu'}), []));
  test('aceita 50 chars',          () => assert.deepEqual(validatePlayerBody({name:'A'.repeat(50)}), []));
  test('rejeita injeção SQL',      () => assert.ok(validatePlayerBody({name:"'; DROP TABLE players; --"}).length > 0));
  test('rejeita script injection', () => assert.ok(validatePlayerBody({name:'<script>alert(1)</script>'}).length > 0));
  test('aceita nome com acento',   () => assert.deepEqual(validatePlayerBody({name:'Márcia'}), []));
  test('aceita apóstrofe (O\'Brien)',()=> assert.deepEqual(validatePlayerBody({name:"O'Brien"}), []));
});

describe('validateSessionBody()', () => {
  const base = { playerId:'550e8400-e29b-41d4-a716-446655440000', game:'memory', level:'easy', score:50, durationMs:30000 };
  test('aceita sessão válida',       () => assert.deepEqual(validateSessionBody(base), []));
  test('rejeita playerId ausente',   () => assert.ok(validateSessionBody({...base,playerId:''}).length > 0));
  test('rejeita jogo inválido',      () => assert.ok(validateSessionBody({...base,game:'chess'}).length > 0));
  test('rejeita nível inválido',     () => assert.ok(validateSessionBody({...base,level:'god'}).length > 0));
  test('rejeita score string',       () => assert.ok(validateSessionBody({...base,score:'high'}).length > 0));
  test('rejeita score negativo',     () => assert.ok(validateSessionBody({...base,score:-1}).length > 0));
  test('rejeita score > 9999',       () => assert.ok(validateSessionBody({...base,score:10000}).length > 0));
  test('aceita score = 0',           () => assert.deepEqual(validateSessionBody({...base,score:0}), []));
  test('aceita wordsearch',          () => assert.deepEqual(validateSessionBody({...base,game:'wordsearch'}), []));
  test('aceita todos os jogos', () => {
    ['memory','speed','sequence','stroop','math','word','wordsearch'].forEach(g => {
      assert.deepEqual(validateSessionBody({...base,game:g}), [], `${g} deve ser válido`);
    });
  });
  test('aceita todos os níveis', () => {
    ['easy','medium','hard'].forEach(l => {
      assert.deepEqual(validateSessionBody({...base,level:l}), [], `${l} deve ser válido`);
    });
  });
});

describe('validateUUID()', () => {
  test('aceita UUID v4 válido',  () => assert.equal(validateUUID('550e8400-e29b-41d4-a716-446655440000'), true));
  test('rejeita string aleatória',()=> assert.equal(validateUUID('nao-e-um-uuid'), false));
  test('rejeita vazio',          () => assert.equal(validateUUID(''), false));
  test('rejeita null',           () => assert.equal(validateUUID(null), false));
  test('rejeita UUID sem hífens',() => assert.equal(validateUUID('550e8400e29b41d4a716446655440000'), false));
});

describe('Result type', () => {
  test('ok() retorna resultado de sucesso', () => {
    const r = Result.ok({ name: 'Maria' });
    assert.equal(r.ok, true);
    assert.deepEqual(r.value, { name: 'Maria' });
  });
  test('fail() retorna resultado de erro', () => {
    const err = new Error('algo deu errado');
    const r = Result.fail(err);
    assert.equal(r.ok, false);
    assert.equal(r.error, err);
  });
  test('isOk()/isFail() funcionam corretamente', () => {
    assert.equal(Result.isOk(Result.ok(1)), true);
    assert.equal(Result.isFail(Result.fail(new Error())), true);
    assert.equal(Result.isOk(Result.fail(new Error())), false);
  });
});

describe('Logger - não loga dados sensíveis', () => {
  test('redact funciona via logger (não quebra)', () => {
    // Logger deve funcionar sem lançar exceção
    assert.doesNotThrow(() => {
      logger.info('test', { password: 'secret', name: 'Maria' });
    });
  });
});
