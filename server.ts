import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  app.use(express.json());

  // API Route: AI Review Summarization via Gemini v3.5-flash
  app.post('/api/gemini/summarize', async (req, res) => {
    try {
      const { studioName, reviews, advantages, rentInstruments } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key is not configured in secrets. Please configure it in Settings.' });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const reviewsText = reviews && reviews.length > 0 
        ? reviews.map((r: any) => `- [평점: ${r.rating}점] ${r.content}`).join('\n')
        : '등록된 유저 리뷰가 없습니다.';

      const advantagesText = advantages && advantages.length > 0
        ? advantages.join(', ')
        : '특별 지정된 태그 없음';

      const rentText = rentInstruments && rentInstruments.length > 0
        ? rentInstruments.map((i: any) => `- ${i.name} (${i.type === 'guitar' ? '일렉기타' : i.type === 'bass' ? '베이스기타' : '기타악기'}): 시간당 ${i.pricePerHour === 0 ? '무료 대여' : `${i.pricePerHour}원`} [${i.description}]`).join('\n')
        : '대여 가능한 추가 악기가 등록되어 있지 않습니다.';

      const prompt = `합주실 이름: "${studioName}"
제공하는 주요 강점: ${advantagesText}
제공되는 대여 악기 목록:
${rentText}

유저 실제 리뷰 목록:
${reviewsText}

위 정보를 종합하여 이 합주실의 가치를 극대화하는 매력 분석 보고서를 한글로 작성해주세요. 
특히 다음 항목을 반드시 포함하여 작성해주세요:

1. **핵심 강점 및 차별성** (방음 상태, 음향 튜닝, 지리적 위치 등)
2. **기타 및 악기 대여 시스템 메리트** (제공되는 일렉기타/베이스 렌탈의 퀄리티와 장단점, 대여가 유용한 상황 분석. 예: 기타가 무료이거나 고가의 프리미엄 기타가 있는 점 등)
3. **이용자 실제 평판 및 피드백 요약** (유저 리뷰 바탕의 솔직한 장단점 분석)
4. **합주실 200% 활용 꿀팁 및 추천 멤버 유형**

가독성이 뛰어나도록 불릿 포인트와 적절한 이모지를 섞어 마크다운(Markdown) 형식으로 아름답게 작성해 주세요.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      res.json({ summary: response.text });
    } catch (error: any) {
      console.error('Gemini summary error:', error);
      res.status(500).json({ error: error.message || 'Gemini API 호출 중 알 수 없는 서버 오류가 발생했습니다.' });
    }
  });

  // Serve Vite in development, static compiled files in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running successfully at http://localhost:${port}`);
  });
}

startServer();
