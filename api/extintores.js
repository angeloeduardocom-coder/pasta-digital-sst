const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM extintores ORDER BY id_num ASC`;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { id_num, tipo, cap, local, ult, prox, obs } = req.body;
      if (!id_num || !prox) return res.status(400).json({ error: 'Identificação e próxima recarga obrigatórios' });
      const [row] = await sql`
        INSERT INTO extintores (id_num, tipo, cap, local, ult, prox, obs)
        VALUES (${id_num}, ${tipo||null}, ${cap||null}, ${local||null}, ${ult||null}, ${prox}, ${obs||null})
        RETURNING *
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
