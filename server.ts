import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
}) : null;

let isImageQuotaZero = false;

app.post('/api/generate-pose', async (req, res) => {
  const { prompt, customImage, poseId, charId } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Le prompt est requis.' });
  }

  if (!ai) {
    return res.status(503).json({ error: 'GEMINI_API_KEY est manquante. Ajoutez-la à .env.local ou aux secrets de votre hébergeur.' });
  }

  // If we already detected that the current API key has no image quota, immediately serve studio fallback
  if (isImageQuotaZero) {
    return res.json({
      imageUrl: null,
      fallbackUsed: true,
      quotaExceeded: true,
      poseId,
      charId,
      message: "Votre clé API est au palier gratuit (quota génération d'images = 0). Le visuel studio officiel a été activé.",
    });
  }

  try {
    const parts: any[] = [{ text: prompt }];

    if (customImage && customImage.data && customImage.mimeType) {
      parts.unshift({
        inlineData: {
          data: customImage.data,
          mimeType: customImage.mimeType,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    });

    let imageUrl = '';
    const candidates = response.candidates;
    if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (imageUrl) {
      return res.json({ imageUrl, fallbackUsed: false });
    }

    // Fallback if no inline image was generated
    return res.json({
      imageUrl: null,
      fallbackUsed: true,
      poseId,
      charId,
      message: 'Génération studio relayée.',
    });
  } catch (error: any) {
    const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    const isQuotaOrPerm = 
      errStr.includes('429') || 
      errStr.includes('RESOURCE_EXHAUSTED') || 
      errStr.includes('Quota exceeded') || 
      errStr.includes('403') || 
      errStr.includes('PERMISSION_DENIED');

    if (isQuotaOrPerm) {
      // Mark quota as zero for this session to avoid repeated failing calls
      isImageQuotaZero = true;
      console.log('Mode studio actif : quota image restreint sur le palier gratuit.');

      return res.json({
        imageUrl: null,
        fallbackUsed: true,
        quotaExceeded: true,
        poseId,
        charId,
        message: "Votre clé API est au palier gratuit (quota génération d'images = 0). Le visuel studio officiel a été activé.",
      });
    }

    // Friendly sanitized error message for real unexpected errors
    let friendlyMessage = 'Erreur lors de la communication avec le service de génération.';
    try {
      const parsed = JSON.parse(errStr);
      if (parsed?.error?.message) {
        friendlyMessage = parsed.error.message.split('\n')[0];
      }
    } catch {
      if (error?.message && !error.message.startsWith('{')) {
        friendlyMessage = error.message;
      }
    }

    return res.status(500).json({ error: friendlyMessage });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('public')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('public/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur ZenPose démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
