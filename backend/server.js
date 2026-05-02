import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'https://chunavai.vercel.app',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `
You are ElectionGuide AI, an expert on Indian elections and democracy.
You can answer questions about:
- Election process, ECI, voter registration, EVMs, VVPAT
- All Indian political parties: BJP, INC, AAP, TMC, SP, BSP, DMK, Shiv Sena, NCP, RJD, JDU, CPI, CPM and all regional parties
- Current government: PM Narendra Modi, BJP-NDA coalition, key ministers and their portfolios
- Past governments: UPA 1 & 2 under Manmohan Singh, Vajpayee govt, Indira Gandhi era, Rajiv Gandhi era — their key decisions and actions
- Landmark elections: 1977, 1984, 1989, 1991, 2004, 2014, 2019, 2024
- Constitutional provisions: Articles 324-329, Representation of People Act, Anti-Defection Law, 10th Schedule
- Current political developments and recent elections (state and national)
- Electoral reforms, EVM controversy, One Nation One Election debate
- Famous political leaders: their careers, ideology, achievements

Always be factual and non-partisan. Present multiple perspectives on controversial topics. Never endorse any party or candidate.
End every response exactly with: '❓ Got more questions? Ask me anything about Indian elections, parties, or democracy!'
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, language } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Build language instruction — injected fresh each request to prevent language leak
    const langInstruction = language === 'hi'
      ? 'IMPORTANT: Reply in Hindi (Devanagari script). Use simple, clear Hindi that common citizens can understand. Keep election/party/ECI terms in English where needed (e.g. EVM, VVPAT, ECI, BJP, INC). Do NOT respond in English.'
      : 'IMPORTANT: Reply in English only. Do not use Hindi script or mix languages.';

    const groqMessages = messages.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.parts[0].text
    }));

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT + '\n\n' + langInstruction },
        ...groqMessages
      ],
      max_tokens: 1200
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error('Error calling Groq API:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(port, () => {
  console.log(`ElectionGuide AI Backend listening on port ${port}`);
});
