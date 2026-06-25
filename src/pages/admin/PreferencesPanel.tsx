import React, { useState } from 'react';
import { useLang } from '../../lib/lang';
import { Settings, Globe, Bell, Moon, Sun, Check } from 'lucide-react';

export default function PreferencesPanel() {
  const { t, lang, setLang } = useLang();
  const [notifs, setNotifs] = useState(true);
  const [dark] = useState(true); // App is always dark — cosmetic toggle for display

  const currentLang = lang;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Settings className="w-6 h-6 text-primary-400" />
        {t('systemPreferences')}
      </h1>

      {/* Language */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-primary-500/20 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t('languagePreference')}</h3>
            <p className="text-white/40 text-xs">{lang === 'ar' ? 'اختر لغة الواجهة' : 'Choose interface language'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { val: 'ar', native: 'العربية', sub: 'Arabic', flag: '🇸🇾' },
            { val: 'en', native: 'English', sub: 'الإنجليزية', flag: '🇬🇧' },
          ] as const).map(opt => (
            <button
              key={opt.val}
              onClick={() => setLang(opt.val)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-start ${
                currentLang === opt.val
                  ? 'bg-primary-600/25 border-primary-500/50 shadow-glow'
                  : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/8'
              }`}
            >
              <span className="text-2xl">{opt.flag}</span>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">{opt.native}</div>
                <div className="text-white/40 text-xs">{opt.sub}</div>
              </div>
              {currentLang === opt.val && (
                <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-navy-700/50 rounded-xl flex items-center justify-center">
            <Moon className="w-5 h-5 text-white/60" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t('themePreference')}</h3>
            <p className="text-white/40 text-xs">{lang === 'ar' ? 'مظهر النظام' : 'System appearance'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { val: 'dark',  Icon: Moon,  label: lang === 'ar' ? 'الوضع الداكن' : 'Dark Mode',  sub: lang === 'ar' ? 'الافتراضي' : 'Default',   active: dark },
            { val: 'light', Icon: Sun,   label: lang === 'ar' ? 'الوضع الفاتح' : 'Light Mode', sub: lang === 'ar' ? 'قريباً' : 'Coming soon', active: !dark },
          ].map(opt => (
            <div
              key={opt.val}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                opt.active
                  ? 'bg-navy-800/60 border-white/25'
                  : 'bg-white/3 border-white/8 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${opt.active ? 'bg-white/10' : 'bg-white/5'}`}>
                <opt.Icon className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-white text-sm">{opt.label}</div>
                <div className="text-white/35 text-xs">{opt.sub}</div>
              </div>
              {opt.active && (
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{t('notifPreference')}</h3>
            <p className="text-white/40 text-xs">{lang === 'ar' ? 'تحكم في الإشعارات' : 'Control notifications'}</p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            {
              label: lang === 'ar' ? 'إشعارات النظام العامة'   : 'Global system notifications',
              sub:   lang === 'ar' ? 'إشعارات من الإدارة لجميع المستخدمين' : 'Admin notifications to all users',
              key: 'system',
            },
            {
              label: lang === 'ar' ? 'إشعارات التذاكر'         : 'Ticket notifications',
              sub:   lang === 'ar' ? 'تنبيه عند استلام أو تحديث تذكرة'   : 'Alert on new or updated ticket',
              key: 'tickets',
            },
            {
              label: lang === 'ar' ? 'إشعارات المواعيد'        : 'Schedule reminders',
              sub:   lang === 'ar' ? 'تذكير قبل موعد الحصة بـ 15 دقيقة'  : 'Reminder 15 min before class',
              key: 'schedule',
            },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/8">
              <div>
                <div className="text-sm font-medium text-white">{item.label}</div>
                <div className="text-xs text-white/35 mt-0.5">{item.sub}</div>
              </div>
              <button
                onClick={() => setNotifs(!notifs)}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 ${notifs ? 'bg-primary-500' : 'bg-white/20'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${notifs ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
