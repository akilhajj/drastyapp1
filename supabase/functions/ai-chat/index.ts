import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = "meta-llama/llama-3-8b-instruct:free";
const OPENROUTER_REFERER = Deno.env.get("SITE_URL") || "https://localhost:5173";

function openRouterHeaders() {
  return {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "HTTP-Referer": OPENROUTER_REFERER,
    "Content-Type": "application/json",
  };
}

function chatCompletionBody(language: string, userMessage: string) {
  const systemPrompt = language === "ar"
    ? `أنت مساعد تعليمي ذكي متخصص في المنهج السوري. أجب على أسئلة الطلاب بشكل واضح ومبسط باللغة العربية. تخصصاتك: العلوم، اللغة العربية، اللغة الفرنسية، الرياضيات، التربية الدينية. استخدم أمثلة بسيطة ومناسبة للطلاب.`
    : `You are a smart educational assistant specializing in the Syrian national curriculum. Answer student questions clearly and simply in English. Specialties: Science, Arabic Language, French Language, Mathematics, Religious Education. Use simple examples appropriate for students.`;

  return JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });
}

async function fetchOpenRouterChat(language: string, userMessage: string) {
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: openRouterHeaders(),
    body: chatCompletionBody(language, userMessage),
  });

  const fallback = language === "ar"
    ? "عذراً، لم أتمكن من معالجة سؤالك. يرجى المحاولة مرة أخرى."
    : "Sorry, I couldn't process your question. Please try again.";

  if (!res.ok) {
    const text = await res.text();
    console.error("OpenRouter error:", text);
    return fallback;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || fallback;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    // ── Voice mode: multipart form with audio file ──────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;
      const language = (formData.get("language") as string) || "ar";

      if (!audioFile) {
        return new Response(
          JSON.stringify({ error: "No audio file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 1: Transcribe with Whisper (OpenAI — OpenRouter has no audio API)
      let transcribedText = "";
      if (OPENAI_API_KEY) {
        const whisperForm = new FormData();
        whisperForm.append("file", audioFile, "recording.webm");
        whisperForm.append("model", "whisper-1");
        whisperForm.append("language", language === "ar" ? "ar" : "en");

        const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: whisperForm,
        });

        if (whisperRes.ok) {
          const { text } = await whisperRes.json();
          transcribedText = text;
        } else {
          const err = await whisperRes.text();
          console.error("Whisper error:", err);
        }
      }

      if (!transcribedText) {
        return new Response(
          JSON.stringify({
            response: language === "ar"
              ? "لم أتمكن من فهم التسجيل. تأكد من إضافة مفتاح OpenAI API لتمكين معالجة الصوت."
              : "I couldn't understand the recording. Make sure your OpenAI API key is set to enable audio processing.",
            audio: null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Step 2: AI response via OpenRouter
      const aiText = OPENROUTER_API_KEY
        ? await fetchOpenRouterChat(language, transcribedText)
        : (language === "ar"
            ? "شكراً على سؤالك. أنا مساعدك الذكي للمنهج السوري. لتفعيل الإجابات الكاملة، يرجى إضافة مفتاح OpenRouter API."
            : "Thank you for your question. I'm your AI tutor for the Syrian curriculum. To enable full AI responses, please add your OpenRouter API key.");

      // Step 3: TTS via OpenAI (OpenRouter has no speech API)
      let audioBase64: string | null = null;
      if (OPENAI_API_KEY && aiText) {
        const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: aiText,
            voice: language === "ar" ? "onyx" : "nova",
            response_format: "mp3",
          }),
        });

        if (ttsRes.ok) {
          const audioBuffer = await ttsRes.arrayBuffer();
          const uint8 = new Uint8Array(audioBuffer);
          let binary = "";
          for (let i = 0; i < uint8.byteLength; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          audioBase64 = btoa(binary);
        } else {
          const err = await ttsRes.text();
          console.error("TTS error:", err);
        }
      }

      return new Response(
        JSON.stringify({ response: aiText, transcription: transcribedText, audio: audioBase64 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Text mode: JSON body ───────────────────────────────────────────────
    const body = await req.json();
    const { message, language = "ar" } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENROUTER_API_KEY) {
      const fallback = language === "ar"
        ? `شكراً على سؤالك: "${message}". أنا مساعدك الذكي للمنهج السوري. لتفعيل الإجابات الكاملة، يرجى إضافة مفتاح OpenRouter API.`
        : `Thank you for your question: "${message}". I'm your AI tutor for the Syrian curriculum. To enable full AI responses, please add your OpenRouter API key.`;
      return new Response(
        JSON.stringify({ response: fallback }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetchOpenRouterChat(language, message);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
