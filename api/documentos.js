const { put, del } = require('@vercel/blob');
const Busboy = require('busboy');
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
      const { funcionario_id } = req.query;
      if (!funcionario_id) return res.status(400).json({ error: 'funcionario_id obrigatório' });

      const bb = Busboy({ headers: req.headers });
      let fileBuffer = null;
      let fileName = '';
      let mimeType = 'application/octet-stream';

      await new Promise((resolve, reject) => {
        bb.on('file', (name, file, info) => {
          const raw = info.filename || 'arquivo';
          fileName = raw.replace(/[\u{FEFF}\u{200B}-\u{200D}\u{FFFE}\u{FFFF}]/gu, '').replace(/[^\w.\-() ]/g, '_').trim() || 'arquivo';
          mimeType = info.mimeType || 'application/octet-stream';
          const chunks = [];
          file.on('data', chunk => chunks.push(chunk));
          file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
        });
        bb.on('finish', resolve);
        bb.on('error', reject);
        req.pipe(bb);
      });

      if (!fileBuffer) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

      const blob = await put(
        `sst/${funcionario_id}/${Date.now()}-${fileName}`,
        fileBuffer,
        { access: 'public', contentType: mimeType }
      );

      const [doc] = await sql`
        INSERT INTO documentos (funcionario_id, nome, tipo, url, tamanho)
        VALUES (${funcionario_id}, ${fileName}, ${mimeType}, ${blob.url}, ${fileBuffer.length})
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
