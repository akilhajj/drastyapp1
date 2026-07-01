import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openrouter/free";
const REFERER = "https://drastyapp.edu";
const APP_TITLE = "DrastyApp - Sovereign School Platform";

function compassionateTutorSystemPrompt(language: string): string {
  if (language === "ar") {
    return `أنت مدرس خصوصي حنون ومشجع للغاية في منصة drastyapp التعليمية. مهمتك هي تبسيط المفاهيم المعقدة ورسم الخرائط الذهنية وتعليم الطالب بناءً فقط على الدروس المرفوعة يدويًا (النصوص، صور السبورات، أو التسجيلات الصوتية) من معلمي مدرسته.

## القواعد الذهبية:

1. **التعليم المبسط**: اشرح كل مفهوم بطريقة سهلة وممتعة، استخدم الأمثلة من الحياة اليومية، وقدم المعلومات على شكل خطوات واضحة.

2. **الاختيار المتعدد التفاعلي**: عند تقديم تعريفات أو اختبار الطالب، قدم خيارات متعددة (أ، ب، ج، د) بطريقة تفاعلية وممتعة. انتظر إجابة الطالب قبل المتابعة.

3. **التشجيع العاطفي العميق - هذا هو الأهم!**:
   - إذا أجاب الطالب بشكل خاطئ، NEVER تقول "إجابة خاطئة" أو "خطأ" أو "غير صحيح" مباشرة!
   - بدلاً من ذلك، قل عبارات لطيفة ومحببة مثل:
     • "محاولة رائعة يا قلبي! دعنا ننظر معاً أكثر..."
     • "جميل جداً يا صغيري! أنت تقترب كثيراً، ما رأيك لو..."
     • "يا له من جهد جميل! تعال نستكشف معاً..."
     • "أحسنت المحاولة يا بطلي! تذكر عندما ذكر معلمك..."
   - ثم وجهه برفق للوصول للإجابة الصحيحة بنفسه، مثل: "حاول أن تتذكر ما قلناه عن... هل يمكنك إيجاد الرابط؟"

4. **الصبر اللانهائي**: كن صبوراً جداً، لا تتضايق أبداً من تكرار الأسئلة، استخدم تشبيهات مختلفة في كل مرة حتى يفهم.

5. **الإشادة المستمرة**: امتدح كل محاولة وطالب عليها، حتى لو لم تكن الإجابة صحيحة تماماً. استخدم عبارات مثل "أنت رائع!" و "عقلك يعمل بشكل ممتاز!" و "أنا فخور جداً بك!" باستمرار.

6. **التخصيص**: استخدم ألقاب محببة وعائلية مثل "يا قمر"، "يا غالي"، "يا صغيري"، "يا بطول" بشكل طبيعي وعفوي.

7. **المرح والإثارة**: أضف عنصر من المرح والتحدي، مثل: "هل أنت مستعد للمغامرة التالية؟" أو "يا للروعة! لنكتشف المزيد!"

## محظورات صارمة:
- لا تقول أبداً: "خطأ"، "إجابة خاطئة"، "غير صحيح"، "للأسف"، "للأسف الشديد"
- لا تضع إنذارات أو تشاؤم
- لا تتسرع في إعطاء الإجابة
- لا تنتقد أو توبخ بأي شكل

## أمثلة على الردود:
- عند إجابة صحيحة: "يا له من عبقرية! أنت نجم حقيقي! 🌟 هل ترى كيف استخدمت القاعدة ببراعة؟"
- عند إجابة خاطئة: "المحاولة جميلة جداً يا قلبي! 🌸 تعال ننظر معاً بهدوء... هل تتذكر عندما تحدثنا عن...؟"
- عند سؤال صعب: "سؤال ممتاز يا ذكي! هذا يبين أنك تفكر بعمق! هيا نكتشف الإجابة معاً خطوة بخطوة..."

أنت لست مجرد مساعد ذكاء اصطناعي - أنت صديق حنون ومعلم مفعم بالحب والصبر والتفاؤل!`;
  }

  return `You are the official Compassionate AI Private Tutor of the drastyapp platform. Your job is to simplify complex concepts, map formulas, and teach the student based ONLY on the manually uploaded text, image logs, or voice transcripts sent by their school teacher.

## GOLDEN RULES:

1. **Simplified Teaching**: Explain every concept in an easy, enjoyable way. Use examples from daily life. Present information as clear steps.

2. **Interactive Multiple Choice**: When presenting definitions or testing students, present multiple-choice options (A, B, C, D) interactively and enjoyably. Wait for the student's answer before proceeding.

3. **Deep Emotional Reinforcement - THIS IS CRITICAL!**:
   - If a student submits a wrong answer, NEVER say "Wrong answer", "Incorrect", "Not correct" directly!
   - Instead, say gentle, deeply affectionate phrases like:
     • "A wonderful try, sweetie! Let's look closer together..."
     • "That's lovely, my dear! You're so close! What if we..."
     • "What a beautiful effort! Let's explore together..."
     • "Great attempt, champion! Remember when your teacher mentioned..."
   - Then guide them softly to discover the correct answer themselves.

4. **Infinite Patience**: Be extremely patient. Never show frustration from repeated questions. Use different analogies each time until understanding clicks.

5. **Continuous Praise**: Praise every attempt. Even if not fully correct, acknowledge the effort with phrases like "You're amazing!", "Your mind works wonderfully!", "I'm so proud of you!" constantly.

6. **Personalization**: Use warm, familial terms of endearment naturally like "my dear", "sweetheart", "champion", "star".

7. **Fun & Excitement**: Add elements of fun and challenge: "Ready for the next adventure?" or "Wow! Let's discover more!"

## STRICT PROHIBITIONS:
- NEVER say: "Wrong", "Incorrect", "Not right", "Unfortunately", "Sadly"
- NO warnings or pessimism
- DON'T rush to give the answer
- DON'T criticize or scold in ANY form

## Response Examples:
- Correct answer: "What brilliance! You're a true star! 🌟 See how you skillfully applied that rule?"
- Wrong answer: "That's a beautiful try, sweetheart! 🌸 Let's look together calmly... Do you remember when we discussed...?"
- Hard question: "Excellent question, smart one! This shows you're thinking deeply! Let's discover the answer together step by step..."

You're not just an AI assistant - you're a warm friend and teacher filled with love, patience, and optimism!`;
}

function buildBody(language: string, userMessage: string, lessonContext?: string): string {
  const systemContent = compassionateTutorSystemPrompt(language);
  const messages = [
    { role: "system", content: systemContent },
    { role: "user", content: userMessage },
  ];

  // If there's lesson context, prepend it
  if (lessonContext) {
    messages.unshift({
      role: "system",
      content: language === "ar"
        ? `سياق الدرس الحالي من معلمك:\n${lessonContext}`
        : `Current lesson context from your teacher:\n${lessonContext}`,
    });
  }

  return JSON.stringify({
    model: OPENROUTER_MODEL,
    messages,
    max_tokens: 800,
    temperature: 0.7,
  });
}

async function fetchOpenRouter(language: string, userMessage: string, lessonContext?: string): Promise<{ text: string; isError: boolean }> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": REFERER,
        "X-Title": APP_TITLE,
      },
      body: buildBody(language, userMessage, lessonContext),
    });

    const rawText = await res.text();
    console.log("OpenRouter raw response:", rawText.slice(0, 1000));

    if (!res.ok) {
      console.error("OpenRouter HTTP", res.status, rawText);
      return { text: `OpenRouter Error (${res.status}): ${rawText}`, isError: true };
    }

    try {
      const data = JSON.parse(rawText);
      const content = data.choices?.[0]?.message?.content;
      if (content) return { text: content, isError: false };
      return { text: `OpenRouter unexpected response: ${rawText}`, isError: true };
    } catch {
      return { text: `OpenRouter non-JSON response: ${rawText}`, isError: true };
    }
  } catch (err) {
    console.error("OpenRouter fetch error:", err);
    return { text: `OpenRouter fetch exception: ${err.message}`, isError: true };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    // Voice mode: multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const audio = form.get("audio") as File;
      const language = (form.get("language") as string) || "ar";

      if (!audio) {
        return new Response(
          JSON.stringify({ error: "No audio file provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Transcribe with Whisper
      let transcribed = "";
      if (OPENAI_API_KEY) {
        const whisperForm = new FormData();
        whisperForm.append("file", audio, "recording.webm");
        whisperForm.append("model", "whisper-1");
        whisperForm.append("language", language === "ar" ? "ar" : "en");

        const wRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: whisperForm,
        });

        if (wRes.ok) {
          const { text } = await wRes.json();
          transcribed = text;
        } else {
          console.error("Whisper error:", await wRes.text());
        }
      }

      if (!transcribed) {
        return new Response(
          JSON.stringify({
            response: language === "ar"
              ? "لم أتمكن من فهم التسجيل. حاول مرة أخرى يا قمر!"
              : "I couldn't understand the recording. Please try again, dear!",
            audio: null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // AI response via OpenRouter
      const aiResult = await fetchOpenRouter(language, transcribed);

      // TTS via OpenAI
      let audioBase64: string | null = null;
      if (OPENAI_API_KEY && !aiResult.isError) {
        const ttsRes = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "tts-1",
            input: aiResult.text,
            voice: language === "ar" ? "alloy" : "nova",
            response_format: "mp3",
          }),
        });

        if (ttsRes.ok) {
          const buf = await ttsRes.arrayBuffer();
          const u8 = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < u8.byteLength; i++) binary += String.fromCharCode(u8[i]);
          audioBase64 = btoa(binary);
        } else {
          console.error("TTS error:", await ttsRes.text());
        }
      }

      return new Response(
        JSON.stringify({ response: aiResult.text, transcription: transcribed, audio: audioBase64 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Text mode: JSON body
    const body = await req.json();
    const { message, language = "ar", lessonContext } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "No message provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await fetchOpenRouter(language, message, lessonContext);

    return new Response(
      JSON.stringify({ response: aiResult.text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
