const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

function calcProx(ult) {
  if (!ult) return null;
  const d = new Date(ult);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

const statusQuery = sql => sql`
  CASE
    WHEN prox IS NULL THEN 'Sem data'
    WHEN prox < CURRENT_DATE THEN 'Vencido'
    WHEN prox <= CURRENT_DATE + INTERVAL '30 days' THEN 'Vencendo'
    ELSE 'Em Dia'
  END AS situacao
`;

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      const rows = await sql`
        SELECT *,
          CASE
            WHEN prox IS NULL THEN 'Sem data'
            WHEN prox < CURRENT_DATE THEN 'Vencido'
            WHEN prox <= CURRENT_DATE + INTERVAL '30 days' THEN 'Vencendo'
            ELSE 'Em Dia'
          END AS situacao
        FROM extintores ORDER BY id_num ASC
      `;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { id_num, tipo, cap, local, ult, prox, obs } = req.body;
      if (!id_num) return res.status(400).json({ error: 'Identificação obrigatória' });

      const proxFinal = prox || calcProx(ult);

      const [row] = await sql`
        INSERT INTO extintores (id_num, tipo, cap, local, ult, prox, obs)
        VALUES (${id_num}, ${tipo||null}, ${cap||null}, ${local||null}, ${ult||null}, ${proxFinal||null}, ${obs||null})
        RETURNING *,
          CASE
            WHEN prox IS NULL THEN 'Sem data'
            WHEN prox < CURRENT_DATE THEN 'Vencido'
            WHEN prox <= CURRENT_DATE + INTERVAL '30 days' THEN 'Vencendo'
            ELSE 'Em Dia'
          END AS situacao
      `;
      return res.json(row);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { id_num, tipo, cap, local, ult, prox, obs } = req.body;
      if (!id || !id_num) return res.status(400).json({ error: 'ID e identificação obrigatórios' });

      const proxFinal = prox || calcProx(ult);

      const [row] = await sql`
        UPDATE extintores
        SET id_num=${id_num}, tipo=${tipo||null}, cap=${cap||null}, local=${local||null},
            ult=${ult||null}, prox=${proxFinal||null}, obs=${obs||null}
        WHERE id=${id}
        RETURNING *,
          CASE
            WHEN prox IS NULL THEN 'Sem data'
            WHEN prox < CURRENT_DATE THEN 'Vencido'
            WHEN prox <= CURRENT_DATE + INTERVAL '30 days' THEN 'Vencendo'
            ELSE 'Em Dia'
          END AS situacao
      `;
      return res.json(row);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM extintores WHERE id=${id}`;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
