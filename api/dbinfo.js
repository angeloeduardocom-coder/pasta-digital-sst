const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const [size] = await sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) AS total,
             pg_database_size(current_database()) AS bytes
    `;
    const tables = await sql`
      SELECT relname AS tabela,
             pg_size_pretty(pg_total_relation_size(oid)) AS tamanho,
             pg_total_relation_size(oid) AS bytes
      FROM pg_class
      WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
      ORDER BY bytes DESC
    `;
    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*) FROM funcionarios)  AS funcionarios,
        (SELECT COUNT(*) FROM treinamentos)  AS treinamentos,
        (SELECT COUNT(*) FROM extintores)    AS extintores,
        (SELECT COUNT(*) FROM inspecoes)     AS inspecoes,
        (SELECT COUNT(*) FROM acidentes)     AS acidentes
    `;
    res.json({ total: size.total, bytes: size.bytes, tabelas: tables, registros: counts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
