const { del } = require('@vercel/blob');
const sql = require('../lib/db');
const { requireAuth } = require('../lib/auth');

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS documentos (
      id SERIAL PRIMARY KEY,
      funcionario_id INTEGER REFERENCES funcionarios(id) ON DELETE CASCADE,
      nome VARCHAR(255),
      tipo VARCHAR(100),
      url TEXT NOT NULL,
      tamanho INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;

  try {
    await ensureTable();

    if (req.method === 'GET') {
      const { funcionario_id } = req.query;
      if (!funcionario_id) return res.status(400).json({ error: 'funcionario_id obrigatório' });
      const docs = await sql`
        SELECT * FROM documentos
        WHERE funcionario_id = ${funcionario_id}
        ORDER BY created_at DESC
      `;
      return res.json(docs);
    }

    if (req.method === 'POST') {
      // O arquivo já foi enviado direto do navegador pro Vercel Blob
      // (ver api/upload-url.js) — aqui só registramos os metadados.
      const { funcionario_id } = req.query;
      if (!funcionario_id) return res.status(400).json({ error: 'funcionario_id obrigatório' });

      const { nome, tipo, url, tamanho } = req.body || {};
      if (!url) return res.status(400).json({ error: 'url do arquivo obrigatória' });
      if (!url.startsWith('https://') || !url.includes('.public.blob.vercel-storage.com/')) {
        return res.status(400).json({ error: 'url inválida' });
      }

      const [doc] = await sql`
        INSERT INTO documentos (funcionario_id, nome, tipo, url, tamanho)
        VALUES (${funcionario_id}, ${nome || 'arquivo'}, ${tipo || 'application/octet-stream'}, ${url}, ${tamanho || null})
        RETURNING *
      `;
      return res.json(doc);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const [doc] = await sql`SELECT url FROM documentos WHERE id = ${id}`;
      if (doc) {
        try { await del(doc.url); } catch (_) {}
        await sql`DELETE FROM documentos WHERE id = ${id}`;
      }
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Método não permitido' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
