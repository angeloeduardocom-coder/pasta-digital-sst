const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    await sql`ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS empregador VARCHAR(255)`;
    await sql`ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS contato VARCHAR(50)`;
    await sql`ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS matricula VARCHAR(50)`;
    await sql`ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS supervisor VARCHAR(255)`;

    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM funcionarios ORDER BY nome ASC`;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { nome, cargo, setor, adm, status, empregador, contato, matricula, supervisor } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
      const [row] = await sql`
        INSERT INTO funcionarios (nome, cargo, setor, adm, status, empregador, contato, matricula, supervisor)
        VALUES (${nome}, ${cargo||null}, ${setor||null}, ${adm||null}, ${status||'Ativo'}, ${empregador||null}, ${contato||null}, ${matricula||null}, ${supervisor||null})
        RETURNING *
      `;
      return res.json(row);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const { nome, cargo, setor, adm, status, empregador, contato, matricula, supervisor } = req.body;
      const [row] = await sql`
        UPDATE funcionarios SET nome=${nome}, cargo=${cargo||null}, setor=${setor||null},
          adm=${adm||null}, status=${status||'Ativo'}, empregador=${empregador||null},
          contato=${contato||null}, matricula=${matricula||null}, supervisor=${supervisor||null}
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
