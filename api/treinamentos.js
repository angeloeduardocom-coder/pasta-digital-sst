const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

function calcProx(ult, per) {
  if (!ult) return null;
  const d = new Date(ult);
  const map = { 'Mensal':1, 'Trimestral':3, 'Semestral':6, 'Anual':12, 'Bienal':24, 'Quinquenal':60 };
  const months = map[per] || 12;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      await sql`ALTER TABLE treinamento_participantes ADD COLUMN IF NOT EXISTS data_realizacao DATE`;
      const rows = await sql`
        SELECT t.*,
          CASE
            WHEN t.prox IS NULL THEN 'Sem data'
            WHEN t.prox < CURRENT_DATE THEN 'Vencido'
            WHEN t.prox <= CURRENT_DATE + INTERVAL '30 days' THEN 'Vencendo'
            ELSE 'Concluído'
          END AS status,
          COALESCE(
            json_agg(json_build_object(
              'id', f.id, 'nome', f.nome, 'cargo', f.cargo, 'setor', f.setor,
              'adm', f.adm, 'status', f.status,
              'data_realizacao', tp.data_realizacao
            )) FILTER (WHERE f.id IS NOT NULL), '[]'
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
      const { nome, cat, per, ult, prox, ch, funcs } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });

      const proxFinal = prox || (ult ? calcProx(ult, per || 'Anual') : null);

      const [t] = await sql`
        INSERT INTO treinamentos (nome, cat, per, ult, prox, status, ch)
        VALUES (${nome}, ${cat||'NR'}, ${per||'Anual'}, ${ult||null}, ${proxFinal}, 'auto', ${ch||0})
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
          CASE
            WHEN t.prox IS NULL THEN 'Sem data'
            WHEN t.prox < CURRENT_DATE THEN 'Vencido'
            WHEN t.prox <= CURRENT_DATE + INTERVAL '30 days' THEN 'Vencendo'
            ELSE 'Concluído'
          END AS status,
          COALESCE(json_agg(f.*) FILTER (WHERE f.id IS NOT NULL), '[]') AS funcs
        FROM treinamentos t
        LEFT JOIN treinamento_participantes tp ON tp.treinamento_id = t.id
        LEFT JOIN funcionarios f ON f.id = tp.funcionario_id
        WHERE t.id = ${t.id}
        GROUP BY t.id
      `;
      return res.json(full);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { nome, cat, per, ult, prox, ch, funcs } = req.body;
      if (!id) return res.status(400).json({ error: 'ID obrigatório' });

      const proxFinal = prox || (ult ? calcProx(ult, per || 'Anual') : null);

      await sql`
        UPDATE treinamentos
        SET nome=COALESCE(${nome||null}, nome), cat=COALESCE(${cat||null}, cat),
            per=${per||'Anual'}, ult=${ult||null}, prox=${proxFinal}, ch=${ch||0}
        WHERE id=${id}
      `;

      if (Array.isArray(funcs)) {
        await sql`DELETE FROM treinamento_participantes WHERE treinamento_id=${id}`;
        for (const fid of funcs) {
          await sql`
            INSERT INTO treinamento_participantes (treinamento_id, funcionario_id)
            VALUES (${id}, ${fid})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      await sql`ALTER TABLE treinamento_participantes ADD COLUMN IF NOT EXISTS data_realizacao DATE`;
      const [full] = await sql`
        SELECT t.*,
          CASE
            WHEN t.prox IS NULL THEN 'Sem data'
            WHEN t.prox < CURRENT_DATE THEN 'Vencido'
            WHEN t.prox <= CURRENT_DATE + INTERVAL '30 days' THEN 'Vencendo'
            ELSE 'Concluído'
          END AS status,
          COALESCE(
            json_agg(json_build_object(
              'id', f.id, 'nome', f.nome, 'cargo', f.cargo, 'setor', f.setor,
              'adm', f.adm, 'status', f.status,
              'data_realizacao', tp.data_realizacao
            )) FILTER (WHERE f.id IS NOT NULL), '[]'
          ) AS funcs
        FROM treinamentos t
        LEFT JOIN treinamento_participantes tp ON tp.treinamento_id = t.id
        LEFT JOIN funcionarios f ON f.id = tp.funcionario_id
        WHERE t.id = ${id}
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
