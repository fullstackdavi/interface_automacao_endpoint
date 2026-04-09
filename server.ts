import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// In-memory store for chat history
let chatHistory: { id: string, sender: 'user' | 'agent', text: string, timestamp: Date }[] = [
  {
    id: '1',
    sender: 'agent',
    text: 'Olá! Sou o seu agente virtual. Como posso ajudar?',
    timestamp: new Date()
  }
];

let chatSession: any = null;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // POST /api/send
  app.post('/api/send', async (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Add user message to history
    const userMsgId = Date.now().toString();
    chatHistory.push({
      id: userMsgId,
      sender: 'user',
      text: message,
      timestamp: new Date()
    });

    // Respond immediately so frontend doesn't block
    res.json({ success: true });

    // Process with Gemini asynchronously
    try {
      if (!chatSession) {
        chatSession = ai.chats.create({
          model: 'gemini-2.5-flash', // Using 2.5-flash as the fast preview model
          config: {
            temperature: 0.2, // Low thinking level / more deterministic
          }
        });
      }

      const response = await chatSession.sendMessage({ message });
      
      chatHistory.push({
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: response.text,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Gemini API Error:', error);
      chatHistory.push({
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: '⚠️ Desculpe, ocorreu um erro ao processar sua mensagem com o Gemini.',
        timestamp: new Date()
      });
    }
  });

  // GET /api/receive
  app.get('/api/receive', (req, res) => {
    res.json(chatHistory);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
