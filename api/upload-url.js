const { handleUpload } = require('@vercel/blob/client');
const { requireAuth } = require('../lib/auth');

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
  if (!requireAuth(req, res)) return;

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let funcionarioId = null;
        try {
          funcionarioId = JSON.parse(clientPayload || '{}').funcionario_id;
        } catch (_) {}
        if (!funcionarioId) throw new Error('funcionario_id obrigatório');
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
