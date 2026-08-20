const sql = require('../lib/db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const secret = req.headers['x-setup-secret'];
  if (secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Proibido' });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS funcionarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cargo VARCHAR(255),
        setor VARCHAR(255),
        adm DATE,
        status VARCHAR(50) DEFAULT 'Ativo',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS treinamentos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cat VARCHAR(50),
        per VARCHAR(50),
        ult DATE,
        prox DATE,
        status VARCHAR(50),
        ch INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS treinamento_participantes (
        treinamento_id INTEGER REFERENCES treinamentos(id) ON DELETE CASCADE,
        funcionario_id INTEGER REFERENCES funcionarios(id) ON DELETE CASCADE,
        PRIMARY KEY (treinamento_id, funcionario_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS extintores (
        id SERIAL PRIMARY KEY,
        id_num VARCHAR(50) NOT NULL,
        tipo VARCHAR(100),
        cap VARCHAR(50),
        local VARCHAR(255),
        ult DATE,
        prox DATE,
        obs TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS inspecoes (
        id SERIAL PRIMARY KEY,
        local VARCHAR(255) NOT NULL,
        data DATE NOT NULL,
        resp VARCHAR(255),
        res VARCHAR(100),
        obs TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS acidentes (
        id SERIAL PRIMARY KEY,
        func VARCHAR(255) NOT NULL,
        data DATE NOT NULL,
        tipo VARCHAR(100),
        descricao TEXT,
        cat VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Cria os 2 usuários padrão se não existirem
    const usuarios = [
      { username: 'tecnico1', password: 'sst@2025' },
      { username: 'tecnico2', password: 'sst@2025' },
    ];

    for (const u of usuarios) {
      const hash = await bcrypt.hash(u.password, 10);
      await sql`
        INSERT INTO users (username, password_hash)
        VALUES (${u.username}, ${hash})
        ON CONFLICT (username) DO NOTHING
      `;
    }

    res.json({ ok: true, message: 'Banco configurado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
