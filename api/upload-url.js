const jwt = require('jsonwebtoken');
const { handleUpload } = require('@vercel/blob/client');

const SECRET = process.env.JWT_SECRET || 'dev-secret';

const ALLOWED_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload;
        try {
          payload = JSON.parse(clientPayload || '{}');
        } catch (_) {
          throw new Error('clientPayload inválido');
        }
        if (!payload.funcionario_id) throw new Error('funcionario_id obrigatório');
        try {
          jwt.verify(payload.token, SECRET);
        } catch (_) {
          throw new Error('Não autorizado');
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });

    return res.json(jsonResponse);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};
