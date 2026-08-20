const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
}

function requireAuth(req, res) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autorizado' });
    return null;
  }
  try {
    return jwt.verify(header.slice(7), SECRET);
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return null;
  }
}

module.exports = { signToken, requireAuth };
