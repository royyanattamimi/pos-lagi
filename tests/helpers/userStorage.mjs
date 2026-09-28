import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

export function userStorageModules(entries = new Map(), { error = null, legacy = null, beforeUpdate } = {}) {
  const client = { from: (table) => {
    assert.equal(table, 'user_profiles')
    const filters = {}
    let operation = 'read'
    let input
    const execute = () => {
      if (error) return { data: null, error }
      const account = input?.user_id ?? filters.user_id
      if (operation === 'insert') {
        if (entries.has(account)) return { data: null, error: { code: '23505', message: 'Already exists' } }
        entries.set(account, structuredClone(input.data))
        return { data: [{ user_id: account }], error: null }
      }
      if (operation === 'update') {
        beforeUpdate?.(entries, account)
        if (JSON.stringify(entries.get(account)) !== filters.data) return { data: [], error: null }
        entries.set(account, structuredClone(input.data))
        return { data: [{ user_id: account }], error: null }
      }
      return { data: entries.has(account) ? { data: structuredClone(entries.get(account)) } : null, error: null }
    }
    const query = {
      select: () => query,
      eq: (field, value) => { filters[field] = value; return query },
      insert: (value) => { operation = 'insert'; input = value; return query },
      update: (value) => { operation = 'update'; input = value; return query },
      maybeSingle: async () => execute(),
      then: (resolve, reject) => Promise.resolve().then(execute).then(resolve, reject),
    }
    return query
  } }
  const cache = {}
  function load(name) {
    if (cache[name]) return cache[name]
    const source = readFileSync(new URL(`../../src/storage/${name}.ts`, import.meta.url), 'utf8')
    const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } })
    const exports = {}
    new Function('exports', 'require', 'localStorage', outputText)(exports,
      (dependency) => dependency === '../lib/supabase' ? { supabase: client } : load(dependency.replace('./', '')),
      { getItem: () => legacy, setItem: () => { throw new Error('Local writes forbidden') } })
    cache[name] = exports
    return exports
  }
  return { profiles: load('profileStorage'), settings: load('settingsStorage'), document: load('userDocument') }
}
