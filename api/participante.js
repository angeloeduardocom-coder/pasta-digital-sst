const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    // Garante que a coluna existe (migration segura)
    await sql`
      ALTER TABLE treinamento_participantes
      ADD COLUMN IF NOT EXISTS data_realizacao DATE
    `;

    if (req.method === 'PUT') {
      const { treinamento_id, funcionario_id, data_realizacao } = req.body;
      if (!treinamento_id || !funcionario_id || !data_realizacao) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }
      await sql`
        UPDATE treinamento_participantes
        SET data_realizacao = ${data_realizacao}
        WHERE treinamento_id = ${treinamento_id} AND funcionario_id = ${funcionario_id}
      `;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
