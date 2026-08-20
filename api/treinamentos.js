const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT t.*,
          COALESCE(
            json_agg(f.*) FILTER (WHERE f.id IS NOT NULL), '[]'
          ) AS funcs
        FROM treinamentos t
        LEFT JOIN treinamento_participantes tp ON tp.treinamento_id = t.id
        LEFT JOIN funcionarios f ON f.id = tp.funcionario_id
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { nome, cat, per, ult, prox, status, ch, funcs } = req.body;
      if (!nome || !ult) return res.status(400).json({ error: 'Nome e data obrigatórios' });

      const [t] = await sql`
        INSERT INTO treinamentos (nome, cat, per, ult, prox, status, ch)
        VALUES (${nome}, ${cat||'NR'}, ${per||'Anual'}, ${ult}, ${prox||null}, ${status||'Concluído'}, ${ch||0})
        RETURNING *
      `;

      if (funcs && funcs.length > 0) {
        for (const fid of funcs) {
          await sql`
            INSERT INTO treinamento_participantes (treinamento_id, funcionario_id)
            VALUES (${t.id}, ${fid})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      const [full] = await sql`
        SELECT t.*,
          COALESCE(json_agg(f.*) FILTER (WHERE f.id IS NOT NULL), '[]') AS funcs
        FROM treinamentos t
        LEFT JOIN treinamento_participantes tp ON tp.treinamento_id = t.id
        LEFT JOIN funcionarios f ON f.id = tp.funcionario_id
        WHERE t.id = ${t.id}
        GROUP BY t.id
      `;
      return res.json(full);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM treinamentos WHERE id=${id}`;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
