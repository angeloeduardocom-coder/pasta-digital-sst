const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM acidentes ORDER BY data DESC`;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { func, data, tipo, descricao, cat } = req.body;
      if (!func || !data) return res.status(400).json({ error: 'Funcionário e data obrigatórios' });
      const [row] = await sql`
        INSERT INTO acidentes (func, data, tipo, descricao, cat)
        VALUES (${func}, ${data}, ${tipo||null}, ${descricao||null}, ${cat||'Não'})
        RETURNING *
      `;
      return res.json(row);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM acidentes WHERE id=${id}`;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
