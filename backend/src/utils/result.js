'use strict';
/**
 * Result<T, E> — sem throws em lógica de negócio.
 * Use cases retornam Result. Controllers fazem o unwrap.
 */
const Result = {
  ok(value)    { return { ok: true,  value }; },
  fail(error)  { return { ok: false, error }; },
  isOk(r)      { return r.ok === true; },
  isFail(r)    { return r.ok === false; },
};

module.exports = { Result };
