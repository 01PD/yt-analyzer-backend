// api/analyze.js
// Vercel Serverless Function (Node.js, CJS 스타일)

module.exports = async (req, res) => {
  // ✅ CORS 헤더 (가장 먼저)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ 프리플라이트(OPTIONS) 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ POST 이외는 거절
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY is not set." });
    }

    const { title, description, stats, durationSeconds, transcript } = req.body || {};

    const safeTitle = title || "";
    const safeDescription = (description || "").slice(0, 500);
    const safeStats = stats || {};
    const views = safeStats.viewCount || 0;
    const likes = safeStats.likeCount || 0;
    const comments = safeStats.commentCount || 0;
    const safeDuration = durationSeconds || 0;
    const safeTranscript = (transcript || "(스크립트/자막 없음)").slice(0, 8000);

    const prompt = `
역할: 유튜브 장편 사연/막장 드라마 채널 전문 작가 겸 분석가.

다음은 하나의 유튜브 영상 정보입니다.

[메타데이터]
- 제목: ${safeTitle}
- 설명(앞부분): ${safeDescription}
- 길이(초): ${safeDuration}
- 조회수: ${views}
- 좋아요: ${likes}
- 댓글수: ${comments}

[스크립트/자막 전문]
${safeTranscript}

위 정보를 기반으로, 아래 항목을 한국어로 분석해서 Markdown 텍스트 형식으로 출력하세요.

1. 한 줄 요약 (두 줄 이내)
2. 서사 구조
   - 도입
   - 갈등
   - 전환/반전
   - 클라이맥스
   - 결말
3. 감정 흐름
   - 주요 감정 키워드 (불안, 분노, 통쾌, 슬픔 등)
   - 감정이 증가/폭발/반전되는 지점
4. 시점
   - 1인칭/3인칭 여부와 내레이션 스타일 설명
5. 주제/메시지
   - 한국 50~70대 여성 시청자가 느낄 수 있는 공감 포인트 중심으로
6. 썸네일·제목 개선 힌트 2~3개
`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errJson = await openaiRes.json().catch(() => ({}));
      return res.status(500).json({
        error: "OpenAI API 호출 실패",
        detail: errJson,
      });
    }

    const data = await openaiRes.json();
    const analysisText = data.choices?.[0]?.message?.content || "";

    // ✅ 분석 텍스트 반환
    return res.status(200).json({ analysisText });
  } catch (err) {
    return res.status(500).json({
      error: "서버 내부 오류",
      detail: err.message || String(err),
    });
  }
};
