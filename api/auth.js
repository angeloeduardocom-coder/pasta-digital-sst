const sql = require('../lib/db');
const bcrypt = require('bcryptjs');
const { signToken } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

  try {
    const [user] = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (!user) return res.status(401).json({ error: 'Usuário ou senha incorretos' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Usuário ou senha incorretos' });

    const token = signToken({ id: user.id, username: user.username });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
};
