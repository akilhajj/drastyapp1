import React, { useEffect, useState, useRef } from 'react';
import { supabase, Subject, Lesson, StudentLessonProgress, DailyLesson, Profile } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import AiChatWidget from '../../components/AiChatWidget';
import HelpTicketModal from '../../components/HelpTicketModal';
import ReligionSelector from '../../components/ReligionSelector';
import Sidebar from '../../components/Sidebar';
import MobileNav from '../../components/MobileNav';
import { getNavForRole, getDefaultTab } from '../../lib/nav';
import {
  Lock, CheckCircle, PlayCircle, ChevronRight, BookOpen, Bell,
  Star, Heart, FlaskConical, Calculator, Globe, Trophy, Zap, Send,
  MessageSquare, Mic, MicOff, Volume2, Image as ImageIcon
} from 'lucide-react';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState(getDefaultTab('student'));

  if (!profile) return null;

  const navItems = getNavForRole('student');

  return (
    <div className="min-h-screen bg-navy-950 bg-mesh">
      <Sidebar
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
      />
      <main className="lg:ps-64 min-h-screen">
        <MobileNav navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
        <div className="p-4 lg:p-8 pb-24">
          <div className="animate-fade-in max-w-4xl mx-auto">
            {activeTab === 'home' && <StudentHome />}
            {activeTab === 'lessons' && <StudentLessons />}
            {activeTab === 'ai_tutor' && <StudentAiTutor />}
            {activeTab === 'student_notif' && <StudentNotifications />}
            {activeTab === 'student_tickets' && <StudentTickets />}
          </div>
        </div>
      </main>
      <HelpTicketModal />
    </div>
  );
}

// ─── Home ───────────────────────────────────────────────────────────────────────
function StudentHome() {
  const { t, lang } = useLang();
  const { profile, refreshProfile } = useAuth();
  const [banners, setBanners] = useState<any[]>([]);
  const [todayLessons, setTodayLessons] = useState<DailyLesson[]>([]);
  const [showReligion, setShowReligion] = useState(false);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [school, setSchool] = useState<any>(null);

  useEffect(() => {
    if (profile?.religion_enabled && !profile.religion_prompt_shown && !profile.religion_choice) {
      setShowReligion(true);
    }
  }, [profile]);

  useEffect(() => {
    async function load() {
      const [bannerRes] = await Promise.all([
        supabase.from('banners').select('*').eq('is_active', true).order('order_index'),
      ]);
      setBanners(bannerRes.data || []);

      if (profile?.school_id) {
        const { data: schoolData } = await supabase.from('schools').select('*').eq('id', profile.school_id).single();
        setSchool(schoolData);

        const today = new Date().toISOString().split('T')[0];
        const { data: lessonsData } = await supabase
          .from('daily_lessons')
          .select('*')
          .eq('school_id', profile.school_id)
          .eq('scheduled_date', today)
          .eq('is_active', true);
        setTodayLessons(lessonsData || []);
      }
    }
    if (profile) load();
  }, [profile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIdx(i => (i + 1) % Math.max(1, banners.length));
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const currentBanner = banners[bannerIdx] || null;

  const gradeLabels: Record<string, string> = {
    primary: lang === 'ar' ? 'الابتدائية' : 'Primary',
    preparatory: lang === 'ar' ? 'الإعدادية' : 'Preparatory',
    intermediate: lang === 'ar' ? 'المتوسطة' : 'Intermediate',
    secondary: lang === 'ar' ? 'الثانوية' : 'Secondary',
  };

  return (
    <div className="space-y-5">
      {showReligion && (
        <ReligionSelector
          onSelect={async (choice) => {
            await supabase.from('profiles').update({ religion_choice: choice, religion_prompt_shown: true }).eq('id', profile?.id);
            await refreshProfile();
            setShowReligion(false);
          }}
          onClose={() => setShowReligion(false)}
        />
      )}

      {/* Welcome Header */}
      <div className="glass-card-3d p-6 flex items-center justify-between">
        <div>
          <p className="text-gold-400 text-sm">{lang === 'ar' ? 'مرحباً،' : 'Welcome,'}</p>
          <h1 className="text-2xl font-bold text-white">{profile?.full_name?.split(' ')[0]}</h1>
          <p className="text-white/40 text-sm mt-1">
            {school ? `${school.name} · ${gradeLabels[profile?.grade_level || 'secondary'] || ''}` : ''}
          </p>
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-700 rounded-2xl flex items-center justify-center text-navy-950 font-bold text-2xl shadow-lg">
          {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
        </div>
      </div>

      {/* Banner */}
      {currentBanner && (
        <div className="relative rounded-2xl overflow-hidden h-44 lg:h-56 glass-card-3d">
          {currentBanner.image_url && (
            <img src={currentBanner.image_url} alt="" className="w-full h-full object-cover absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 to-transparent" />
          <div className="relative h-full flex flex-col justify-end p-5">
            <h2 className="text-lg font-bold text-white leading-tight">
              {lang === 'ar' ? currentBanner.title_ar : currentBanner.title_en}
            </h2>
            {currentBanner.subtitle_ar && (
              <p className="text-white/60 text-sm mt-1">
                {lang === 'ar' ? currentBanner.subtitle_ar : currentBanner.subtitle_en}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Today's Lessons */}
      <div>
        <h3 className="font-bold text-gold-400 mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {lang === 'ar' ? 'دروس اليوم' : "Today's Lessons"}
        </h3>
        {todayLessons.length === 0 ? (
          <div className="glass-card-3d p-6 text-center text-white/30">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{lang === 'ar' ? 'لا توجد دروس لليوم' : 'No lessons for today'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayLessons.map(lesson => (
              <div key={lesson.id} className="glass-card-3d p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-700 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-navy-950" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">{lesson.title}</div>
                  <div className="text-white/50 text-xs mt-1">{lesson.subject}</div>
                </div>
                {lesson.attached_media && lesson.attached_media.length > 0 && (
                  <div className="flex gap-1">
                    {lesson.attached_media.map((m, i) => (
                      <div key={i} className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                        {m.type === 'image' ? <ImageIcon className="w-3 h-3 text-white/60" /> : <Volume2 className="w-3 h-3 text-white/60" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lessons ───────────────────────────────────────────────────────────────────
function StudentLessons() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<DailyLesson[]>([]);
  const [selected, setSelected] = useState<DailyLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'primary' | 'preparatory' | 'intermediate' | 'secondary'>('all');

  useEffect(() => {
    async function loadLessons() {
      if (!profile?.school_id) {
        setLoading(false);
        return;
      }
      let query = supabase
        .from('daily_lessons')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .order('scheduled_date', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('target_grade', filter);
      }

      const { data } = await query;
      setLessons(data || []);
      setLoading(false);
    }
    loadLessons();
  }, [profile, filter]);

  const gradeLabels: Record<string, string> = {
    primary: lang === 'ar' ? 'الابتدائية' : 'Primary',
    preparatory: lang === 'ar' ? 'الإعدادية' : 'Preparatory',
    intermediate: lang === 'ar' ? 'المتوسطة' : 'Intermediate',
    secondary: lang === 'ar' ? 'الثانوية' : 'Secondary',
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-white/60 hover:text-white">
          <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? '' : 'rotate-180'}`} />
          {lang === 'ar' ? 'رجوع' : 'Back'}
        </button>

        <div className="glass-card-3d p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge badge-info">{selected.subject}</span>
            <span className="badge" style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}>
              {gradeLabels[selected.target_grade]}
            </span>
            <span className="text-white/40 text-xs">
              {new Date(selected.scheduled_date).toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US')}
            </span>
          </div>

          <h2 className="text-xl font-bold text-gold-400 mb-4">{selected.title}</h2>

          <div className="prose prose-invert max-w-none">
            <p className="text-white/80 whitespace-pre-wrap">{selected.content}</p>
          </div>

          {/* Media attachments */}
          {selected.attached_media && selected.attached_media.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="text-white font-bold">{lang === 'ar' ? 'الوسائط المرفقة' : 'Attached Media'}</h4>
              {selected.attached_media.map((media, i) => (
                <div key={i} className="glass-card p-4">
                  {media.type === 'image' ? (
                    <img src={media.data} alt={media.caption || ''} className="w-full rounded-lg" />
                  ) : (
                    <audio controls src={media.data} className="w-full" />
                  )}
                  {media.caption && <p className="text-white/50 text-xs mt-2">{media.caption}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gold-400">{lang === 'ar' ? 'دروسي' : 'My Lessons'}</h1>

      {/* Grade filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'glass text-white/60'}`}
        >
          {lang === 'ar' ? 'الكل' : 'All'}
        </button>
        {['primary', 'preparatory', 'intermediate', 'secondary'].map(g => (
          <button
            key={g}
            onClick={() => setFilter(g as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === g ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' : 'glass text-white/60'}`}
          >
            {gradeLabels[g]}
          </button>
        ))}
      </div>

      {loading
        ? [...Array(5)].map((_, i) => <div key={i} className="glass-card-3d p-5 shimmer-bg h-24" />)
        : lessons.length === 0
          ? <div className="glass-card-3d p-10 text-center text-white/30">{lang === 'ar' ? 'لا توجد دروس' : 'No lessons available'}</div>
          : lessons.map(lesson => (
              <div key={lesson.id} onClick={() => setSelected(lesson)}
                className="glass-card-3d p-5 cursor-pointer hover:border-gold-500/40 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-700 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-navy-950" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-info text-xs">{lesson.subject}</span>
                      <span className="text-white/40 text-xs">{new Date(lesson.scheduled_date).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-white">{lesson.title}</h3>
                    <p className="text-white/50 text-sm mt-1 line-clamp-2">{lesson.content}</p>
                    {lesson.attached_media && lesson.attached_media.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {lesson.attached_media.map((m, i) => (
                          <div key={i} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            {m.type === 'image' ? <ImageIcon className="w-4 h-4 text-gold-400" /> : <Volume2 className="w-4 h-4 text-gold-400" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gold-400 shrink-0 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </div>
              </div>
            ))
      }
    </div>
  );
}

// ─── AI Tutor with COST-OPTIMIZED Sliding Window ───────────────────────────
// ⚠️ COST CONTROL: Only sends last 4 messages to OpenRouter API
// ⚠️ IMAGES: Never sent to API - stored and displayed locally only

const MAX_HISTORY_MESSAGES = 4; // Sliding window size for token savings

function StudentAiTutor() {
  const { lang } = useLang();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [tokensUsed, setTokensUsed] = useState(0);
  const [sessionCost, setSessionCost] = useState(0);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // ⚠️ COST CONTROL: Build sliding window history (last N messages only)
      const recentHistory = messages.slice(-MAX_HISTORY_MESSAGES).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      }));

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        // Send only the sliding window history, not full conversation
        body: JSON.stringify({
          message: userMsg,
          language: lang,
          history: recentHistory,
        }),
      });

      let aiText = lang === 'ar'
        ? 'أنا معلمك الخصوصي الحنون. كيف يمكنني مساعدتك اليوم يا قمر؟'
        : "I'm your compassionate private tutor. How can I help you today, dear?";

      if (response.ok) {
        const data = await response.json();
        if (data.response) aiText = data.response;
        // Track tokens for cost monitoring
        if (data.tokensUsed) {
          setTokensUsed(prev => prev + data.tokensUsed);
        }
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);

      // Log to database (asynchronously, don't await)
      if (profile) {
        supabase.from('chat_messages').insert({
          student_id: profile.id,
          school_id: profile.school_id,
          user_message: userMsg,
          ai_response: aiText,
        }).then();
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: lang === 'ar' ? 'حدث خطأ. حاول مرة أخرى يا قلبي!' : 'Something went away. Please try again, dear!',
      }]);
    }
    setLoading(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = processVoice;
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      alert(lang === 'ar' ? 'تعذر الوصول للميكروفون' : 'Could not access microphone');
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  }

  async function processVoice() {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: lang === 'ar' ? '🎤 رسالة صوتية' : '🎤 Voice message' }]);

    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('language', lang);

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: formData,
      });

      let aiText = lang === 'ar'
        ? 'سمعت سؤالك يا قمر! كيف يمكنني مساعدتك؟'
        : "I heard your question, dear! How can I help?";

      if (response.ok) {
        const data = await response.json();
        if (data.response) aiText = data.response;
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: lang === 'ar' ? 'حدث خطأ في معالجة الصوت.' : 'Error processing voice.',
      }]);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-400">{lang === 'ar' ? 'المعلم الخصوصي الذكي' : 'AI Private Tutor'}</h1>
        <div className="flex items-center gap-3">
          {/* Token usage indicator - Cost control visibility */}
          {tokensUsed > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
              <Zap className="w-3 h-3" />
              ~{tokensUsed} tokens
            </div>
          )}
          <button
            onClick={() => setMode(mode === 'text' ? 'voice' : 'text')}
            className={`p-2 rounded-xl ${mode === 'voice' ? 'bg-gold-500/20 text-gold-400' : 'glass text-white/60'}`}
          >
            {mode === 'voice' ? <Mic className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Cost-saving notice */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
        <Zap className="w-3.5 h-3.5" />
        {lang === 'ar'
          ? 'توفير التكاليف: يُرسل آخر 4 رسائل فقط للذكاء الاصطناعي'
          : 'Cost-saving: Only last 4 messages sent to AI'}
      </div>

      {/* Chat container */}
      <div className="glass-card-3d p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gold-500 to-gold-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
              <MessageSquare className="w-12 h-12 text-navy-950" />
            </div>
            <h3 className="text-lg font-bold text-gold-400 mb-2">
              {lang === 'ar' ? 'مرحباً يا قمر!' : 'Hello, dear!'}
            </h3>
            <p className="text-white/50 text-sm">
              {lang === 'ar'
                ? 'أنا معلمك الخصوصي الحنون. اسألني أي سؤال عن دروسك!'
                : "I'm your compassionate private tutor. Ask me anything about your lessons!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-700 rounded-full flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-navy-950" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gold-500/20 text-white rounded-tr-sm border border-gold-500/30'
                    : 'bg-white/10 text-white/90 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-700 rounded-full flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-navy-950" />
                </div>
                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="glass-card-3d p-4">
        {mode === 'text' ? (
          <div className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={lang === 'ar' ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="premium-btn px-6 disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={loading}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                recording
                  ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] scale-110'
                  : 'bg-gradient-to-br from-gold-500 to-gold-700 shadow-[0_0_30px_rgba(212,175,55,0.4)]'
              } disabled:opacity-40`}
            >
              {recording ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-navy-950" />}
            </button>
            <p className="text-white/50 text-sm">
              {recording
                ? (lang === 'ar' ? 'جاري التسجيل... اترك للإيقاف' : 'Recording... Release to stop')
                : (lang === 'ar' ? 'اضغط للتسجيل' : 'Press to record')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notifications ──────────────────────────────────────────────────────────────
function StudentNotifications() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from('notifications').select('*')
      .or(`recipient_id.eq.${profile.id},is_global.eq.true`)
      .order('created_at', { ascending: false })
      .then(({ data }) => setNotifs(data || []));
  }, [profile]);

  async function markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  const typeIcon = { info: '💡', success: '✅', warning: '⚠️', alert: '🔔' };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gold-400">{t('notifications')}</h1>
      <div className="space-y-3">
        {notifs.length === 0 ? (
          <div className="glass-card-3d p-10 text-center">
            <Bell className="w-12 h-12 text-gold-400/30 mx-auto mb-3" />
            <p className="text-white/30">{t('noData')}</p>
          </div>
        ) : (
          notifs.map(n => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)}
              className={`glass-card-3d p-4 cursor-pointer transition-all ${!n.is_read ? 'border-gold-500/30' : ''}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{typeIcon[n.type as keyof typeof typeIcon] || '🔔'}</span>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{lang === 'ar' ? n.title_ar : n.title_en}</div>
                  <div className="text-white/60 text-xs mt-1">{lang === 'ar' ? n.body_ar : n.body_en}</div>
                  <div className="text-white/30 text-xs mt-2">{new Date(n.created_at).toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}</div>
                </div>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-gold-400 shrink-0 mt-1" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Tickets ───────────────────────────────────────────────────────────────────
function StudentTickets() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgText, setMsgText] = useState('');
  const [showNew, setShowNew] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  async function loadTickets() {
    if (!profile) return;
    const { data } = await supabase.from('help_tickets').select('*').eq('student_id', profile.id).order('created_at', { ascending: false });
    setTickets(data || []);
  }
  useEffect(() => { loadTickets(); }, [profile]);

  async function openTicket(tk: any) {
    setSelected(tk);
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', tk.id).order('created_at');
    setMessages(data || []);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function sendMessage() {
    if (!msgText.trim() || !selected || !profile) return;
    await supabase.from('ticket_messages').insert({ ticket_id: selected.id, sender_id: profile.id, sender_role: 'student', message: msgText.trim() });
    setMsgText('');
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', selected.id).order('created_at');
    setMessages(data || []);
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelected(null); loadTickets(); }} className="p-2 glass rounded-xl text-white/60 hover:text-white">
            <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? '' : 'rotate-180'}`} />
          </button>
          <div>
            <h2 className="font-bold text-white">{selected.title}</h2>
            <span className={selected.status === 'open' ? 'badge-danger' : selected.status === 'in_progress' ? 'badge-warning' : 'badge-success'}>{selected.status}</span>
          </div>
        </div>
        <div className="glass-card-3d p-4 h-80 overflow-y-auto space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex gap-2 ${m.sender_role === 'student' ? 'justify-end' : ''}`}>
              {m.sender_role !== 'student' && <div className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-xs text-navy-950 shrink-0 font-bold">T</div>}
              <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${m.sender_role === 'student' ? 'bg-gold-500/20 text-white rounded-tr-sm border border-gold-500/30' : 'bg-white/10 text-white/80 rounded-tl-sm'}`}>
                {m.message}
                <div className="text-xs opacity-50 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
              {m.sender_role === 'student' && <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white shrink-0 font-bold">S</div>}
            </div>
          ))}
          <div ref={msgEndRef} />
        </div>
        {selected.status !== 'closed' && (
          <div className="flex gap-2">
            <input value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
              className="input-field flex-1" placeholder={t('sendMessage') + '...'} />
            <button onClick={sendMessage} className="premium-btn px-4"><Send className="w-4 h-4" /></button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-400">{t('tickets')}</h1>
        <button onClick={() => setShowNew(true)} className="premium-btn flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4" /> {t('openTicket')}
        </button>
      </div>
      {showNew && <NewTicketForm profile={profile} onClose={() => { setShowNew(false); loadTickets(); }} />}
      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="glass-card-3d p-10 text-center text-white/30">{t('noData')}</div>
        ) : (
          tickets.map(tk => (
            <div key={tk.id} onClick={() => openTicket(tk)}
              className="glass-card-3d p-4 cursor-pointer hover:border-gold-500/30 transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-700 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-navy-950" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">{tk.title}</div>
                  <div className="text-white/40 text-xs">{new Date(tk.created_at).toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}</div>
                </div>
                <span className={tk.status === 'open' ? 'badge-danger' : tk.status === 'in_progress' ? 'badge-warning' : 'badge-success'}>
                  {tk.status === 'open' ? t('ticketOpen') : tk.status === 'in_progress' ? t('ticketInProgress') : t('ticketClosed')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NewTicketForm({ profile, onClose }: { profile: any; onClose: () => void }) {
  const { t, lang } = useLang();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!title.trim() || !body.trim() || !profile) return;
    setLoading(true);
    const { data: ticket } = await supabase.from('help_tickets').insert({
      student_id: profile.id, title: title.trim(), status: 'open',
    }).select().maybeSingle();
    if (ticket) {
      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id, sender_id: profile.id, sender_role: 'student', message: body.trim(),
      });
    }
    onClose();
    setLoading(false);
  }

  return (
    <div className="glass-card-3d p-5 animate-slide-up space-y-4">
      <h3 className="font-bold text-gold-400">{t('openTicket')}</h3>
      <div>
        <label className="text-white/50 text-sm mb-1 block">{t('ticketTitle')} <span className="text-red-400">*</span></label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="input-field" />
      </div>
      <div>
        <label className="text-white/50 text-sm mb-1 block">{t('ticketMessage')} <span className="text-red-400">*</span></label>
        <textarea value={body} onChange={e => setBody(e.target.value)} className="input-field resize-none" rows={3} />
      </div>
      <div className="flex gap-2">
        <button onClick={submit} disabled={loading || !title.trim() || !body.trim()} className="premium-btn flex-1">{t('submit')}</button>
        <button onClick={onClose} className="premium-btn-outline">{t('cancel')}</button>
      </div>
    </div>
  );
}
