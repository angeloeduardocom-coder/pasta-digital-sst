const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { maiusculo } = require('../lib/maiusculo');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM inspecoes ORDER BY data DESC`;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { local, data, resp, res: resultado, obs } = maiusculo(req.body, ['local','resp','obs']);
      if (!local || !data) return res.status(400).json({ error: 'Local e data obrigatórios' });
      const [row] = await sql`
        INSERT INTO inspecoes (local, data, resp, res, obs)
        VALUES (${local}, ${data}, ${resp||null}, ${resultado||'Satisfatório'}, ${obs||null})
        RETURNING *
      `;
      return res.json(row);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM inspecoes WHERE id=${id}`;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
