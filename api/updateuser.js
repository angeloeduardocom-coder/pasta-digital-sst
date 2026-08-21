const sql = require('../lib/db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (req.headers['x-setup-secret'] !== 'troca-agora-2026')
    return res.status(403).json({ error: 'Proibido' });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Dados obrigatórios' });

  const hash = await bcrypt.hash(password, 10);

  await sql`DELETE FROM users`;
  await sql`INSERT INTO users (username, password_hash) VALUES (${username}, ${hash})`;

  res.json({ ok: true, mensagem: `Usuário ${username} criado com sucesso.` });
};
