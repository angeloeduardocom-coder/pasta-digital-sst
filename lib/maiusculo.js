// Padroniza campos de texto livre em MAIÚSCULO antes de gravar no banco.
// Não mexe em datas, ids, status, listas de seleção nem urls.
function maiusculo(body, campos) {
  const out = { ...(body || {}) };
  for (const c of campos) {
    if (typeof out[c] === 'string') {
      out[c] = out[c].trim().replace(/\s+/g, ' ').toLocaleUpperCase('pt-BR');
    }
  }
  return out;
}

module.exports = { maiusculo };
