const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM funcionarios ORDER BY nome ASC`;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { nome, cargo, setor, adm, status } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
      const [row] = await sql`
        INSERT INTO funcionarios (nome, cargo, setor, adm, status)
        VALUES (${nome}, ${cargo||null}, ${setor||null}, ${adm||null}, ${status||'Ativo'})
        RETURNING *
      `;
      return res.json(row);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { nome, cargo, setor, adm, status } = req.body;
      const [row] = await sql`
        UPDATE funcionarios SET nome=${nome}, cargo=${cargo||null}, setor=${setor||null},
          adm=${adm||null}, status=${status||'Ativo'}
        WHERE id=${id} RETURNING *
      `;
      return res.json(row);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM funcionarios WHERE id=${id}`;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
