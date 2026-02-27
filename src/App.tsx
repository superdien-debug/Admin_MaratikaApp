import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import clsx from 'clsx';
import { newsAdminService, type NewsArticle } from './services/newsAdminService';
import { notificationAdminService, type AppNotification } from './services/notificationAdminService';
import { microLearningAdminService, type MicroLearningPost } from './services/microLearningAdminService';
import { rebirthAdminService, type Realm } from './services/rebirthAdminService';
import { surveyAdminService, type SurveyQuestion } from './services/surveyAdminService';
import { Plus, Trash2, Edit3, Save, X, Newspaper, LogOut, Lock, Bell, Calendar, Settings, Sliders, Users, LayoutDashboard, ShieldCheck, ShieldAlert, BookOpen, Dices, Check, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

type Tab = 'news' | 'notifications' | 'settings' | 'users' | 'dashboard' | 'moderation' | 'micro_learning' | 'realms' | 'survey';

type AppConfig = {
  key: string;
  label: string;
  value: number;
  description: string;
  category: string;
};

type UserProfile = {
  id: string;
  display_name: string;
  email?: string;
  role: string;
  created_at: string;
  avatar_url?: string;
};

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // News state
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<NewsArticle>>({ title: '', content: '', excerpt: '', image_url: '' });

  // Micro Learning state
  const [mlPosts, setMLPosts] = useState<MicroLearningPost[]>([]);
  const [editingMLId, setEditingMLId] = useState<string | null>(null);
  const [showMLForm, setShowMLForm] = useState(false);
  const [mlForm, setMLForm] = useState<Partial<MicroLearningPost>>({ title: '', content: '', summary: '', image_url: '', category: 'General', is_published: true, price_mpoints: 0 });

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [editingNotifId, setEditingNotifId] = useState<string | null>(null);
  const [notifForm, setNotifForm] = useState<Partial<AppNotification>>({
    title: '', content: '', scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), type: 'announcement'
  });

  // Settings state
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [savingConfig, setSavingConfig] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Moderation & Practice Management state
  const [allPractices, setAllPractices] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [modSubTab, setModSubTab] = useState<'practices' | 'logs' | 'manage'>('practices');
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);
  const [showPracticeForm, setShowPracticeForm] = useState(false);
  const [practiceForm, setPracticeForm] = useState<any>({
    title: '',
    category: 'Guru Yoga',
    description: '',
    library_group: 'AP',
    is_public: true,
    is_active: true,
    target_type: 'duration',
    daily_target: 20,
    target_unit: 'minutes'
  });

  const AP_CATEGORIES = ['Guru Yoga', 'Quy y', 'Mantra', 'Sadhana', 'Study'];
  const AH_CATEGORIES = ['Địa Đại', 'Thủy Đại', 'Hỏa Đại', 'Phong Đại', 'Không Đại'];

  // Dashboard stats
  const [stats, setStats] = useState({ users: 0, practices: 0, logs: 0, news: 0 });

  // Realms state
  const [realms, setRealms] = useState<Realm[]>([]);
  const [editingRealmId, setEditingRealmId] = useState<number | null>(null);
  const [realmForm, setRealmForm] = useState<Partial<Realm>>({});
  const [publicPractices, setPublicPractices] = useState<any[]>([]);
  const [selectedPractices, setSelectedPractices] = useState<string[]>([]);

  // Survey state
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([]);
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [surveyForm, setSurveyForm] = useState<Partial<SurveyQuestion>>({
    text: '',
    is_buddhist_only: false,
    order_index: 0,
    is_active: true
  });

  // Auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdminStatus(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkAdminStatus(session.user.id);
      else { setIsAdmin(false); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (data?.role === 'admin') {
        setIsAdmin(true);
        loadAll();
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Admin check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    setIsDataLoading(true);
    await Promise.all([
      loadNews(),
      loadNotifications(),
      loadMLPosts(),
      loadConfigs(),
      loadUsers(),
      loadModeration(),
      loadStats(),
      loadRealms(),
      loadPublicPractices(),
      loadSurveyQuestions()
    ]);
    setIsDataLoading(false);
  };

  const loadPublicPractices = async () => {
    try {
      const { data } = await supabase.from('practices').select('id, title').eq('is_public', true).order('title');
      setPublicPractices(data || []);
    } catch (err) { console.error(err); }
  };

  const loadNews = async () => {
    try { const data = await newsAdminService.getAll(); setNews(data); } catch (err) { console.error(err); }
  };

  const loadMLPosts = async () => {
    try { const data = await microLearningAdminService.getAll(); setMLPosts(data); } catch (err) { console.error(err); }
  };

  const loadNotifications = async () => {
    try { const data = await notificationAdminService.getAll(); setNotifications(data); } catch (err) { console.error(err); }
  };

  const loadConfigs = async () => {
    try {
      const { data } = await supabase.from('app_configs').select('*').order('category');
      setConfigs(data || []);
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(data || []);
    } catch (err) { console.error(err); }
  };

  const loadModeration = async () => {
    try {
      const { data: practices } = await supabase
        .from('practices')
        .select('id, title, created_at, profiles(display_name), category, description, library_group, is_public, is_active, target_type, daily_target, target_unit')
        .order('created_at', { ascending: false });
      setAllPractices(practices || []);

      const { data: logs } = await supabase
        .from('practice_logs')
        .select('id, created_at, practices(title), profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      setAllLogs(logs || []);
    } catch (err) { console.error(err); }
  };

  const loadStats = async () => {
    try {
      const [u, p, l, n] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('practices').select('id', { count: 'exact', head: true }),
        supabase.from('practice_logs').select('id', { count: 'exact', head: true }),
        supabase.from('news').select('id', { count: 'exact', head: true }),
      ]);
      setStats({ users: u.count || 0, practices: p.count || 0, logs: l.count || 0, news: n.count || 0 });
    } catch (err) { console.error(err); }
  };

  const loadRealms = async () => {
    try {
      const data = await rebirthAdminService.getAllRealms();
      setRealms(data);
    } catch (err) { console.error(err); }
  };

  const loadSurveyQuestions = async () => {
    try {
      const data = await surveyAdminService.getAll();
      setSurveyQuestions(data);
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch (err: any) { alert(err.message || 'Login failed'); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = () => supabase.auth.signOut();

  // News handlers
  const handleSaveNews = async () => {
    try {
      const articleData = { ...form, author_id: session.user.id };
      if (editingId) await newsAdminService.update(editingId, articleData);
      else await newsAdminService.create(articleData);
      setShowForm(false); setEditingId(null);
      setForm({ title: '', content: '', excerpt: '', image_url: '' });
      loadNews();
    } catch { alert('Failed to save article'); }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('Delete this article?')) return;
    try { await newsAdminService.delete(id); loadNews(); } catch { alert('Failed to delete'); }
  };

  const startEditNews = (article: NewsArticle) => {
    setEditingId(article.id); setForm(article); setShowForm(true);
  };

  // Micro Learning handlers
  const handleSaveML = async () => {
    try {
      const postData = { ...mlForm, author_id: session.user.id };
      if (editingMLId) await microLearningAdminService.update(editingMLId, postData);
      else await microLearningAdminService.create(postData);
      setShowMLForm(false); setEditingMLId(null);
      setMLForm({ title: '', content: '', summary: '', image_url: '', category: 'General', is_published: true, price_mpoints: 0 });
      loadMLPosts();
    } catch { alert('Failed to save micro-learning post'); }
  };

  const handleDeleteML = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try { await microLearningAdminService.delete(id); loadMLPosts(); } catch { alert('Failed to delete'); }
  };

  const startEditML = (post: MicroLearningPost) => {
    setEditingMLId(post.id); setMLForm(post); setShowMLForm(true);
  };

  // Notification handlers
  const handleSaveNotif = async () => {
    try {
      if (editingNotifId) await notificationAdminService.update(editingNotifId, notifForm);
      else await notificationAdminService.create({ ...notifForm, created_by: session.user.id });
      setShowNotifForm(false); setEditingNotifId(null);
      setNotifForm({ title: '', content: '', scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), type: 'announcement' });
      loadNotifications();
    } catch { alert('Failed to save notification'); }
  };

  const handleDeleteNotif = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try { await notificationAdminService.delete(id); loadNotifications(); } catch { alert('Failed to delete'); }
  };

  const startEditNotif = (notif: AppNotification) => {
    setEditingNotifId(notif.id);
    setNotifForm({ ...notif, scheduled_at: format(new Date(notif.scheduled_at), "yyyy-MM-dd'T'HH:mm") });
    setShowNotifForm(true);
  };

  // Config handler
  const handleUpdateConfig = async (key: string, value: number) => {
    setSavingConfig(key);
    try {
      await supabase.from('app_configs').update({ value }).eq('key', key);
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
    } catch { alert('Failed to save config'); }
    finally { setSavingConfig(null); }
  };

  // User role handler
  const handleSetRole = async (userId: string, role: string) => {
    try {
      await supabase.from('profiles').update({ role }).eq('id', userId);
      loadUsers();
    } catch { alert('Failed to update role'); }
  };

  // Moderation & Practice handlers
  const handleSavePractice = async () => {
    if (!practiceForm.title) return;
    try {
      const payload = {
        ...practiceForm,
        updated_at: new Date().toISOString()
      };
      if (editingPracticeId) {
        const { error } = await supabase.from('practices').update(payload).eq('id', editingPracticeId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('practices').insert([{ ...payload, user_id: session.user.id }]);
        if (error) throw error;
      }
      setShowPracticeForm(false);
      setEditingPracticeId(null);
      loadModeration();
    } catch (e) {
      console.error(e);
      alert('Error saving practice');
    }
  };

  const startEditPractice = (item: any) => {
    setEditingPracticeId(item.id);
    setPracticeForm({
      title: item.title,
      category: item.category,
      description: item.description,
      library_group: item.library_group || 'AP',
      is_public: item.is_public,
      is_active: item.is_active,
      target_type: item.target_type,
      daily_target: item.daily_target,
      target_unit: item.target_unit
    });
    setShowPracticeForm(true);
  };

  const handleDeletePractice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this practice? This cannot be undone.')) return;
    const { error } = await supabase.from('practices').delete().eq('id', id);
    if (!error) loadModeration();
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Delete log?')) return;
    const { error } = await supabase.from('practice_logs').delete().eq('id', id);
    if (!error) loadModeration();
  };

  // Realms handlers
  const startEditRealm = async (realm: Realm) => {
    setEditingRealmId(realm.id);
    setRealmForm(realm);
    try {
      const pids = await rebirthAdminService.getRealmPractices(realm.id);
      setSelectedPractices(pids);
    } catch (err) {
      console.error('Failed to load realm practices', err);
      setSelectedPractices([]);
    }
  };

  const handleSaveRealm = async () => {
    if (!editingRealmId) return;
    try {
      await rebirthAdminService.updateRealm(editingRealmId, realmForm);
      await rebirthAdminService.updateRealmPractices(editingRealmId, selectedPractices);
      setEditingRealmId(null);
      setRealmForm({});
      setSelectedPractices([]);
      loadRealms();
      alert('Realm updated successfully!');
    } catch (err) {
      alert('Failed to update realm.');
      console.error(err);
    }
  };

  const togglePractice = (id: string) => {
    setSelectedPractices(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Survey handlers
  const handleSaveSurveyQuestion = async () => {
    try {
      if (editingQuestionId) await surveyAdminService.update(editingQuestionId, surveyForm);
      else await surveyAdminService.create(surveyForm);
      setShowSurveyForm(false);
      setEditingQuestionId(null);
      setSurveyForm({ text: '', is_buddhist_only: false, order_index: 0, is_active: true });
      loadSurveyQuestions();
    } catch { alert('Failed to save survey question'); }
  };

  const handleDeleteSurveyQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try { await surveyAdminService.delete(id); loadSurveyQuestions(); } catch { alert('Failed to delete'); }
  };

  const startEditSurveyQuestion = (q: SurveyQuestion) => {
    setEditingQuestionId(q.id);
    setSurveyForm(q);
    setShowSurveyForm(true);
  };

  // ── Render ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-lg">Initializing Admin...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-maroon-800 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-maroon-50 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="text-maroon-800" size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Vajrayana Admin</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required placeholder="Email" className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-maroon-800/20 shadow-inner" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" required placeholder="Password" className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-maroon-800/20 shadow-inner" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" disabled={authLoading} className="w-full bg-maroon-800 text-white p-4 rounded-xl font-black uppercase shadow-lg shadow-maroon-800/20">
              {authLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 max-w-sm">
          <ShieldAlert className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-slate-500 mt-2 mb-6">Admin privileges required.</p>
          <button onClick={handleLogout} className="text-maroon-800 font-bold hover:underline">Sign Out</button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'news', label: 'News', icon: <Newspaper size={18} /> },
    { id: 'micro_learning', label: 'Micro Learning', icon: <BookOpen size={18} /> },
    { id: 'realms', label: 'Realms', icon: <Dices size={18} /> },
    { id: 'notifications', label: 'Notifs', icon: <Bell size={18} /> },
    { id: 'moderation', label: 'Moderation', icon: <ShieldCheck size={18} /> },
    { id: 'survey', label: 'Survey', icon: <HelpCircle size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20">
      {isDataLoading && <div className="fixed top-0 left-0 right-0 h-1 bg-maroon-800 animate-pulse z-[100]" />}

      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-maroon-800 rounded-xl flex items-center justify-center text-white"><ShieldAlert size={18} /></div>
          <h1 className="text-lg font-black text-slate-900 leading-none">Admin Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{session.user.email}</span>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <nav className="flex max-w-7xl mx-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={twMerge(
              "px-5 py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all",
              activeTab === tab.id ? "border-maroon-800 text-maroon-800 bg-maroon-50/10" : "border-transparent text-slate-400 hover:text-slate-600"
            )}>{tab.icon} {tab.label}</button>
          ))}
        </nav>
      </div>

      <main className="max-w-7xl mx-auto p-8">
        {/* ── Dashboard ── */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { l: 'Users', v: stats.users, i: <Users />, c: 'bg-blue-50 text-blue-600' },
              { l: 'Practices', v: stats.practices, i: <BookOpen />, c: 'bg-indigo-50 text-indigo-600' },
              { l: 'Logs', v: stats.logs, i: <Check />, c: 'bg-emerald-50 text-emerald-600' },
              { l: 'News', v: stats.news, i: <Newspaper />, c: 'bg-amber-50 text-amber-600' },
            ].map(s => (
              <div key={s.l} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className={twMerge("w-10 h-10 rounded-xl flex items-center justify-center mb-4 child-svg:w-5 child-svg:h-5", s.c)}>{s.i}</div>
                <p className="text-3xl font-black text-slate-900">{s.v.toLocaleString()}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">User</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Role</th><th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-400">{u.display_name?.[0] || '?'}</div>
                        <div><p className="font-bold text-slate-800">{u.display_name || 'No Name'}</p><p className="text-[10px] text-slate-400">{u.email || u.id.slice(0, 10)}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 rounded-md text-slate-500">{u.role || 'student'}</span></td>
                    <td className="px-6 py-4 text-right">
                      <select value={u.role || 'student'} onChange={e => handleSetRole(u.id, e.target.value)} className="text-[10px] font-bold border border-slate-200 rounded p-1 bg-white outline-none">
                        <option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── News ── */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <button onClick={() => { setEditingId(null); setForm({ title: '', content: '', excerpt: '', image_url: '' }); setShowForm(true); }} className="bg-maroon-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-maroon-800/20"><Plus size={18} /> New Article</button>
            {showForm && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <input placeholder="Title" className="w-full p-4 bg-slate-50 border-none rounded-xl" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <textarea placeholder="Content" className="w-full p-4 bg-slate-50 border-none rounded-xl h-48" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                <div className="flex justify-end gap-3 pt-4"><button onClick={() => setShowForm(false)} className="px-4 py-2 font-bold text-slate-400">Cancel</button><button onClick={handleSaveNews} className="bg-maroon-800 text-white px-6 py-2 rounded-xl font-bold">Save</button></div>
              </div>
            )}
            <div className="grid gap-4">
              {news.map(n => (
                <div key={n.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                  <div><h3 className="font-bold text-slate-800">{n.title}</h3><p className="text-xs text-slate-400">{format(new Date(n.created_at!), 'MMM d, yyyy')}</p></div>
                  <div className="flex gap-2"><button onClick={() => startEditNews(n)} className="p-2 text-slate-300 hover:text-maroon-800"><Edit3 size={18} /></button><button onClick={() => handleDeleteNews(n.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Moderation & Practices ── */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="flex gap-4 p-1 bg-slate-200/50 rounded-2xl w-fit">
              {['practices', 'manage', 'logs'].map(t => (
                <button key={t} onClick={() => setModSubTab(t as any)} className={twMerge(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                  modSubTab === t ? "bg-white text-maroon-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}>{t}</button>
              ))}
            </div>

            {modSubTab === 'manage' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black text-slate-800">{editingId ? 'Edit Practice' : 'Create Practice Entry'}</h2>
                  {showPracticeForm && <button onClick={() => setShowPracticeForm(false)} className="text-slate-300 hover:text-slate-500"><X /></button>}
                </div>

                {!showPracticeForm ? (
                  <button onClick={() => { setShowPracticeForm(true); setEditingPracticeId(null); setPracticeForm({ title: '', category: AP_CATEGORIES[0], description: '', library_group: 'AP', is_public: true, is_active: true, target_type: 'duration', daily_target: 20, target_unit: 'minutes' }); }} className="w-full py-10 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-maroon-800/30 hover:text-maroon-800 transition-all flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300"><Plus size={32} /></div>
                    Create a new practice template
                  </button>
                ) : (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Practice Title</label>
                        <input className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-maroon-800/10" value={practiceForm.title} onChange={e => setPracticeForm({ ...practiceForm, title: e.target.value })} /></div>

                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Group</label>
                          <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                            {['AP', 'AH'].map(g => (
                              <button key={g} onClick={() => setPracticeForm({ ...practiceForm, library_group: g, category: g === 'AP' ? AP_CATEGORIES[0] : AH_CATEGORIES[0] })} className={twMerge("flex-1 py-2 rounded-lg text-xs font-black transition-all", practiceForm.library_group === g ? "bg-white shadow text-maroon-800" : "text-slate-400")}>{g}</button>
                            ))}
                          </div></div>
                        <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Category</label>
                          <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xs" value={practiceForm.category} onChange={e => setPracticeForm({ ...practiceForm, category: e.target.value })}>
                            {(practiceForm.library_group === 'AP' ? AP_CATEGORIES : AH_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                          </select></div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Target Value</label><input type="number" className="w-full p-4 bg-slate-50 border-none rounded-2xl" value={practiceForm.daily_target} onChange={e => setPracticeForm({ ...practiceForm, daily_target: parseInt(e.target.value) })} /></div>
                        <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Unit</label><input className="w-full p-4 bg-slate-50 border-none rounded-2xl" value={practiceForm.target_unit} onChange={e => setPracticeForm({ ...practiceForm, target_unit: e.target.value })} /></div>
                      </div>
                      <div className="flex gap-6 pt-4"><label className="flex items-center gap-3"><input type="checkbox" checked={practiceForm.is_public} onChange={e => setPracticeForm({ ...practiceForm, is_public: e.target.checked })} /> <span className="text-xs font-bold text-slate-600">Public</span></label><label className="flex items-center gap-3"><input type="checkbox" checked={practiceForm.is_active} onChange={e => setPracticeForm({ ...practiceForm, is_active: e.target.checked })} /> <span className="text-xs font-bold text-slate-600">Active</span></label></div>
                    </div>

                    <div className="md:col-span-2 border-t border-slate-50 pt-8 flex justify-end gap-3"><button onClick={() => setShowPracticeForm(false)} className="px-6 py-2.5 font-bold text-slate-400">Cancel</button><button onClick={handleSavePractice} className="bg-maroon-800 text-white px-8 py-2.5 rounded-2xl font-black text-sm shadow-xl shadow-maroon-800/20">Save Practice</button></div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-[9px] font-black uppercase tracking-widest text-slate-400"><th className="px-8 py-5">Item</th><th className="px-8 py-5 text-center">Group/Cat</th><th className="px-8 py-5 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {modSubTab !== 'logs' ? allPractices.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/30">
                      <td className="px-8 py-5"><div><p className="font-extrabold text-slate-800">{p.title}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Creator: {p.profiles?.display_name || 'System'}</p></div></td>
                      <td className="px-8 py-5 text-center"><div className="inline-block px-2.5 py-1 rounded bg-slate-100 text-[10px] font-black text-slate-600 mb-1">{p.library_group}</div><p className="text-[9px] font-bold text-slate-400 uppercase">{p.category}</p></td>
                      <td className="px-8 py-5 text-right"><div className="flex justify-end gap-1"><button onClick={() => startEditPractice(p)} className="p-2 text-slate-300 hover:text-maroon-800"><Edit3 size={18} /></button><button onClick={() => handleDeletePractice(p.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button></div></td>
                    </tr>
                  )) : allLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/30"><td className="px-8 py-5"><div><p className="font-bold text-slate-800">{l.practices?.title}</p><p className="text-[10px] text-maroon-800 font-black uppercase">{l.profiles?.display_name}</p></div></td><td className="px-8 py-5 text-center text-xs text-slate-400">{format(new Date(l.created_at), 'MMM d • HH:mm')}</td><td className="px-8 py-5 text-right"><button onClick={() => handleDeleteLog(l.id)} className="p-3 text-slate-300 hover:text-red-500"><Trash2 size={20} /></button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Realms ── */}
        {activeTab === 'realms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {realms.map(r => (
              <div key={r.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group">
                <div className="flex justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-maroon-50 text-maroon-800 flex items-center justify-center font-black">#{r.id}</div>
                  <button onClick={() => startEditRealm(r)} className="p-2 text-slate-300 hover:text-maroon-800"><Edit3 size={18} /></button>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">{r.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-6">{r.short_desc}</p>
                <div className="grid grid-cols-6 gap-1 bg-slate-50 p-2 rounded-xl">
                  {[1, 2, 3, 4, 5, 6].map(d => <div key={d} className="flex flex-col items-center"><span className="text-[8px] font-black text-slate-300">{d}</span><span className="text-[10px] font-bold text-slate-700">{(r as any)[`dice_${d}`]}</span></div>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Survey ── */}
        {activeTab === 'survey' && (
          <div className="space-y-6">
            <button onClick={() => { setEditingQuestionId(null); setSurveyForm({ text: '', is_buddhist_only: false, order_index: surveyQuestions.length + 1, is_active: true }); setShowSurveyForm(true); }} className="bg-maroon-800 text-white px-8 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl shadow-maroon-800/10"><Plus size={18} /> New Question</button>
            {showSurveyForm && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
                <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Question Content</label><textarea className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={surveyForm.text} onChange={e => setSurveyForm({ ...surveyForm, text: e.target.value })} /></div>
                <div className="flex justify-end gap-3"><button onClick={() => setShowSurveyForm(false)} className="px-6 py-2 font-bold text-slate-400">Cancel</button><button onClick={handleSaveSurveyQuestion} className="bg-emerald-600 text-white px-8 py-2 rounded-2xl font-black text-xs">Save Question</button></div>
              </div>
            )}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50"><tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest"><th className="px-8 py-5">Idx</th><th className="px-8 py-5">Question</th><th className="px-8 py-5 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {surveyQuestions.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50/30">
                      <td className="px-8 py-5 font-black text-slate-300">{q.order_index}</td>
                      <td className="px-8 py-5 font-bold text-slate-700 text-sm">{q.text}</td>
                      <td className="px-8 py-5 text-right flex justify-end gap-1"><button onClick={() => startEditSurveyQuestion(q)} className="p-2 text-slate-300 hover:text-maroon-800"><Edit3 size={16} /></button><button onClick={() => handleDeleteSurveyQuestion(q.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-10">
            {Array.from(new Set(configs.map(c => c.category))).map(cat => (
              <section key={cat}>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300 mb-6 flex items-center gap-3">
                  <div className="h-[1px] bg-slate-200 flex-1" /> {cat} Settings <div className="h-[1px] bg-slate-200 flex-1" />
                </h2>
                <div className="grid gap-4">
                  {configs.filter(c => c.category === cat).map(cfg => (
                    <div key={cfg.key} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                      <div><p className="font-bold text-slate-800">{cfg.label}</p><p className="text-[10px] text-slate-400 font-medium">{cfg.description}</p></div>
                      <input type="number" defaultValue={cfg.value} onBlur={e => handleUpdateConfig(cfg.key, parseFloat(e.target.value))} className="w-20 p-2 bg-slate-50 rounded-lg text-center font-black text-maroon-800 outline-none focus:ring-2 focus:ring-maroon-800/10" />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* Floating Notif (Optional) */}
      <footer className="fixed bottom-6 right-6 z-[50]">
        <div className="bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-2xl backdrop-blur flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Sync Enabled</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
