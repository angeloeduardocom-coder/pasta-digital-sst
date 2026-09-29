const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM investigacoes ORDER BY created_at DESC`;
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const {
        acidente_id, data_investigacao, responsavel, metodo,
        fatos_apurados, causas_imediatas, causas_basicas,
        acoes_corretivas, resp_acoes, prazo_acoes, conclusao, status,
      } = req.body;
      if (!acidente_id) return res.status(400).json({ error: 'Acidente é obrigatório' });

      const [row] = await sql`
        INSERT INTO investigacoes (
          acidente_id, data_investigacao, responsavel, metodo,
          fatos_apurados, causas_imediatas, causas_basicas,
          acoes_corretivas, resp_acoes, prazo_acoes, conclusao, status
        )
        VALUES (
          ${acidente_id}, ${data_investigacao || null}, ${responsavel || null}, ${metodo || null},
          ${fatos_apurados || null}, ${causas_imediatas || null}, ${causas_basicas || null},
          ${acoes_corretivas || null}, ${resp_acoes || null}, ${prazo_acoes || null}, ${conclusao || null},
          ${status || 'Em andamento'}
        )
        ON CONFLICT (acidente_id) DO UPDATE SET
          data_investigacao = EXCLUDED.data_investigacao,
          responsavel = EXCLUDED.responsavel,
          metodo = EXCLUDED.metodo,
          fatos_apurados = EXCLUDED.fatos_apurados,
          causas_imediatas = EXCLUDED.causas_imediatas,
          causas_basicas = EXCLUDED.causas_basicas,
          acoes_corretivas = EXCLUDED.acoes_corretivas,
          resp_acoes = EXCLUDED.resp_acoes,
          prazo_acoes = EXCLUDED.prazo_acoes,
          conclusao = EXCLUDED.conclusao,
          status = EXCLUDED.status
        RETURNING *
      `;
      return res.json(row);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM investigacoes WHERE id=${id}`;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
