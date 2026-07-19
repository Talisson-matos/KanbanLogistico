import { Router } from 'express';
import multer from 'multer';
import { GridFSBucket, ObjectId } from 'mongodb';
import { conectar } from '../db.js';

const BUCKET_NAME = 'anexos';
const TAMANHO_MAXIMO_MB = 25;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANHO_MAXIMO_MB * 1024 * 1024 },
});

const router = Router();

async function obterBucket() {
  const db = await conectar();
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

function formatarMetadados(doc) {
  return {
    id: String(doc._id),
    tarefaId: doc.metadata?.tarefaId ?? null,
    nomeArquivo: doc.filename,
    tipoMime: doc.contentType ?? 'application/octet-stream',
    tamanho: doc.length,
    criadoEm: doc.metadata?.criadoEm ?? doc.uploadDate?.toISOString() ?? new Date().toISOString(),
    enviadoPor: doc.metadata?.enviadoPor ?? null,
  };
}

/**
 * GET /api/arquivos?tarefaId=xxx
 * Lista os metadados dos anexos (opcionalmente filtrados por tarefa).
 */
router.get('/', async (req, res, next) => {
  try {
    const db = await conectar();
    const filtro = {};
    if (req.query.tarefaId) filtro['metadata.tarefaId'] = String(req.query.tarefaId);

    const arquivos = await db
      .collection(`${BUCKET_NAME}.files`)
      .find(filtro)
      .sort({ uploadDate: 1 })
      .toArray();

    res.json(arquivos.map(formatarMetadados));
  } catch (erro) {
    next(erro);
  }
});

/**
 * POST /api/arquivos
 * multipart/form-data com campo `tarefaId` e um ou mais arquivos no
 * campo `arquivos` — suporta envio de múltiplos arquivos de uma vez.
 */
router.post('/', upload.array('arquivos', 20), async (req, res, next) => {
  try {
    const tarefaId = req.body.tarefaId;
    if (!tarefaId) {
      return res.status(400).json({ erro: 'Campo "tarefaId" é obrigatório.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado.' });
    }

    const bucket = await obterBucket();
    const enviadoPor = req.body.enviadoPor || 'sistema';
    const criadoEm = new Date().toISOString();
    const resultados = [];

    for (const arquivo of req.files) {
      const metadata = { tarefaId: String(tarefaId), enviadoPor, criadoEm };

      // eslint-disable-next-line no-await-in-loop
      const idGerado = await new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(arquivo.originalname, {
          contentType: arquivo.mimetype,
          metadata,
        });
        uploadStream.once('error', reject);
        uploadStream.once('finish', () => resolve(uploadStream.id));
        uploadStream.end(arquivo.buffer);
      });

      resultados.push(
        formatarMetadados({
          _id: idGerado,
          filename: arquivo.originalname,
          length: arquivo.buffer.length,
          contentType: arquivo.mimetype,
          metadata,
        }),
      );
    }

    res.status(201).json(resultados);
  } catch (erro) {
    next(erro);
  }
});

/**
 * GET /api/arquivos/:id/download?disposition=inline|attachment
 * Faz o streaming do binário do arquivo. `disposition=inline` (padrão)
 * permite pré-visualizar no navegador ("Ver Arquivo"); `attachment`
 * força o download ("Baixar Arquivo").
 */
router.get('/:id/download', async (req, res, next) => {
  try {
    let objectId;
    try {
      objectId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ erro: 'Id de arquivo inválido.' });
    }

    const db = await conectar();
    const doc = await db.collection(`${BUCKET_NAME}.files`).findOne({ _id: objectId });
    if (!doc) return res.status(404).json({ erro: 'Arquivo não encontrado.' });

    const disposition = req.query.disposition === 'attachment' ? 'attachment' : 'inline';
    res.set('Content-Type', doc.contentType || 'application/octet-stream');
    res.set(
      'Content-Disposition',
      `${disposition}; filename="${encodeURIComponent(doc.filename)}"`,
    );

    const bucket = await obterBucket();
    bucket
      .openDownloadStream(objectId)
      .on('error', () => res.status(404).end())
      .pipe(res);
  } catch (erro) {
    next(erro);
  }
});

/**
 * DELETE /api/arquivos/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    let objectId;
    try {
      objectId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ erro: 'Id de arquivo inválido.' });
    }

    const bucket = await obterBucket();
    try {
      await bucket.delete(objectId);
    } catch {
      return res.status(404).json({ erro: 'Arquivo não encontrado.' });
    }

    res.status(204).end();
  } catch (erro) {
    next(erro);
  }
});

export default router;
