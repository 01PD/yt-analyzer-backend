// api/analyze.js

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "No OPENAI_API_KEY set." });

    const { title, description, stats, durationSeconds, transcript } = req.body;

    const prompt = `
유튜브 영상 분석:
제목: ${title}
조회수: ${stats?.viewCount}
좋아요: ${stats?.likeCount}
댓글: ${stats?.commentCount}
길이(초): ${durationSeconds}

스크립트/자막:
${transcript || "(없음)"}

요약, 서사 구조, 감정 흐름, 시점, 주제, 썸네일 개선까지 분석.
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
      }),
    });

    const data = await openaiRes.json();
    return res.status(200).json({ analysisText: data.choices?.[0]?.message?.content });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
};

