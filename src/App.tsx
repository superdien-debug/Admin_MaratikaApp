import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { newsAdminService, type NewsArticle } from './services/newsAdminService';
import { notificationAdminService, type AppNotification } from './services/notificationAdminService';
import { microLearningAdminService, type MicroLearningPost } from './services/microLearningAdminService';
import { Plus, Trash2, Edit3, Save, X, Newspaper, LogOut, Lock, Bell, Calendar, Settings, Sliders, Users, LayoutDashboard, ShieldCheck, ShieldAlert, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'news' | 'notifications' | 'settings' | 'users' | 'dashboard' | 'moderation' | 'micro_learning';

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
  const [mlForm, setMLForm] = useState<Partial<MicroLearningPost>>({ title: '', content: '', summary: '', image_url: '', category: 'General', is_published: true });

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

  // Moderation state
  const [allPractices, setAllPractices] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [modSubTab, setModSubTab] = useState<'practices' | 'logs'>('practices');

  // Dashboard stats
  const [stats, setStats] = useState({ users: 0, practices: 0, logs: 0, news: 0 });

  // Auth inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

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
    loadNews();
    loadNotifications();
    loadMLPosts();
    loadConfigs();
    loadUsers();
    loadModeration();
    loadStats();
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
        .select('id, title, created_at, profiles(display_name)')
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
      setMLForm({ title: '', content: '', summary: '', image_url: '', category: 'General', is_published: true });
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

  // Moderation handlers
  const handleDeletePractice = async (id: string) => {
    if (!confirm('Delete this practice?')) return;
    try { await supabase.from('practices').delete().eq('id', id); loadModeration(); } catch { alert('Failed to delete'); }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Delete this log?')) return;
    try { await supabase.from('practice_logs').delete().eq('id', id); loadModeration(); } catch { alert('Failed to delete'); }
  };

  // ── Render gates ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse text-lg">Initializing Admin...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-maroon-800 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.1),transparent)]">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-maroon-50 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="text-maroon-800" size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Vajrayana Admin</h1>
            <p className="text-slate-400 text-sm mt-1">Authorized Access Only</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Email Address</label>
              <input type="email" required className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-maroon-800/20 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Password</label>
              <input type="password" required className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-maroon-800/20 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={authLoading} className="w-full bg-maroon-800 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-maroon-900 transition-colors shadow-lg shadow-maroon-800/20 disabled:opacity-50">
              {authLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <X className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-500 mt-2 mb-6">Your account doesn't have administrative privileges.</p>
          <button onClick={handleLogout} className="text-maroon-800 font-bold hover:underline">Sign out and try another account</button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'users', label: 'Users', icon: <Users size={18} /> },
    { id: 'news', label: 'News', icon: <Newspaper size={18} /> },
    { id: 'micro_learning', label: 'Micro Learning', icon: <BookOpen size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'moderation', label: 'Moderation', icon: <ShieldCheck size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-maroon-800 rounded-xl flex items-center justify-center">
            <ShieldAlert size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">Maratika Admin</h1>
            <p className="text-xs text-slate-400">Sangha Command Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{session?.user?.email}</span>
          <button onClick={handleLogout} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-slate-200 px-8">
        <nav className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id
                ? 'border-maroon-800 text-maroon-800'
                : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab action bar */}
      <div className="bg-white border-b border-slate-100 px-8 py-3 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          {tabs.find(t => t.id === activeTab)?.label}
        </h2>
        <div className="flex gap-2">
          {activeTab === 'news' && (
            <button
              onClick={() => { setEditingId(null); setForm({ title: '', content: '', excerpt: '', image_url: '' }); setShowForm(true); }}
              className="bg-maroon-800 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-maroon-900 transition-colors shadow-sm shadow-maroon-800/20"
            >
              <Plus size={16} /> New Article
            </button>
          )}
          {activeTab === 'notifications' && (
            <button
              onClick={() => { setEditingNotifId(null); setNotifForm({ title: '', content: '', scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), type: 'announcement' }); setShowNotifForm(true); }}
              className="bg-maroon-800 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-maroon-900 transition-colors shadow-sm shadow-maroon-800/20"
            >
              <Plus size={16} /> New Notification
            </button>
          )}
          {activeTab === 'micro_learning' && (
            <button
              onClick={() => { setEditingMLId(null); setMLForm({ title: '', content: '', summary: '', image_url: '', category: 'General', is_published: true }); setShowMLForm(true); }}
              className="bg-maroon-800 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-maroon-900 transition-colors shadow-sm shadow-maroon-800/20"
            >
              <Plus size={16} /> New Lesson
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-8 py-8">

        {/* ── Dashboard ── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Total Users', value: stats.users, icon: <Users size={22} />, color: 'text-blue-600 bg-blue-50' },
                { label: 'Practices', value: stats.practices, icon: <Newspaper size={22} />, color: 'text-purple-600 bg-purple-50' },
                { label: 'Completions', value: stats.logs, icon: <ShieldCheck size={22} />, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'News Articles', value: stats.news, icon: <Bell size={22} />, color: 'text-amber-600 bg-amber-50' },
              ].map(stat => (
                <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <p className="text-3xl font-black text-slate-900">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wide mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-2">Welcome back!</h3>
              <p className="text-slate-500 text-sm">Use the tabs above to manage the Maratika community. You can publish news, send notifications, moderate practices, manage users, and configure app settings.</p>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url
                          ? <img src={user.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                          : <div className="w-9 h-9 rounded-full bg-maroon-50 flex items-center justify-center text-maroon-800 font-black text-sm">{user.display_name?.[0] ?? '?'}</div>
                        }
                        <div>
                          <p className="font-bold text-slate-800">{user.display_name || 'No Name'}</p>
                          <p className="text-xs text-slate-400">{user.email || user.id.slice(0, 12)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${user.role === 'admin' ? 'bg-maroon-100 text-maroon-800' :
                        user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>{user.role || 'student'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{format(new Date(user.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={user.role || 'student'}
                        onChange={e => handleSetRole(user.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 outline-none cursor-pointer hover:border-maroon-800/30 transition-colors"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
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
          <>
            {showForm && (
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                <h2 className="text-xl font-bold mb-6 text-slate-800">{editingId ? 'Edit Article' : 'Create New Article'}</h2>
                <div className="grid gap-5">
                  <input type="text" placeholder="Article Title" className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-800/20" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  <input type="text" placeholder="Image URL" className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-800/20" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                  <textarea placeholder="Excerpt (short summary)" className="w-full p-3 rounded-lg border border-slate-200 h-20 focus:outline-none focus:ring-2 focus:ring-maroon-800/20" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
                  <textarea placeholder="Full Content (HTML supported)" className="w-full p-3 rounded-lg border border-slate-200 h-64 focus:outline-none focus:ring-2 focus:ring-maroon-800/20 font-mono text-sm" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => { setShowForm(false); setEditingId(null); setForm({ title: '', content: '', excerpt: '', image_url: '' }); }} className="px-5 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-2">
                      <X size={18} /> Cancel
                    </button>
                    <button onClick={handleSaveNews} className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                      <Save size={18} /> {editingId ? 'Update' : 'Publish'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            <div className="grid gap-6">
              {news.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">No articles found. Start by creating one!</div>
              ) : news.map(article => (
                <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-6 hover:shadow-md transition-shadow">
                  {article.image_url
                    ? <img src={article.image_url} alt="" className="w-40 h-28 object-cover rounded-xl bg-slate-100" />
                    : <div className="w-40 h-28 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100"><Newspaper size={32} className="text-slate-200" /></div>
                  }
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{article.title}</h3>
                        <p className="text-sm text-slate-400 mt-1">{format(new Date(article.created_at!), 'MMM d, yyyy • HH:mm')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditNews(article)} className="p-2 text-slate-400 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-colors"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteNews(article.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mt-3 line-clamp-2">{article.excerpt || 'No summary provided.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Micro Learning ── */}
        {activeTab === 'micro_learning' && (
          <>
            {showMLForm && (
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                <h2 className="text-xl font-bold mb-6 text-slate-800">{editingMLId ? 'Edit Lesson' : 'Create Micro Learning Lesson'}</h2>
                <div className="grid gap-5">
                  <div className="grid grid-cols-2 gap-5">
                    <input type="text" placeholder="Lesson Title" className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-800/20" value={mlForm.title} onChange={e => setMLForm({ ...mlForm, title: e.target.value })} />
                    <input type="text" placeholder="Category (e.g., Mind, Wisdom)" className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-800/20" value={mlForm.category} onChange={e => setMLForm({ ...mlForm, category: e.target.value })} />
                  </div>
                  <input type="text" placeholder="Image URL" className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-800/20" value={mlForm.image_url} onChange={e => setMLForm({ ...mlForm, image_url: e.target.value })} />
                  <textarea placeholder="Teaser Summary (appears on cards)" className="w-full p-3 rounded-lg border border-slate-200 h-20 focus:outline-none focus:ring-2 focus:ring-maroon-800/20" value={mlForm.summary} onChange={e => setMLForm({ ...mlForm, summary: e.target.value })} />
                  <textarea placeholder="Main content (Markdown/HTML supported)" className="w-full p-3 rounded-lg border border-slate-200 h-64 focus:outline-none focus:ring-2 focus:ring-maroon-800/20 font-mono text-sm" value={mlForm.content} onChange={e => setMLForm({ ...mlForm, content: e.target.value })} />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={mlForm.is_published} onChange={e => setMLForm({ ...mlForm, is_published: e.target.checked })} className="w-4 h-4 rounded text-maroon-800 focus:ring-maroon-800/20" />
                      <span className="text-sm font-bold text-slate-600">Published</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => { setShowMLForm(false); setEditingMLId(null); setMLForm({ title: '', content: '', summary: '', image_url: '', category: 'General', is_published: true }); }} className="px-5 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-2">
                      <X size={18} /> Cancel
                    </button>
                    <button onClick={handleSaveML} className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                      <Save size={18} /> {editingMLId ? 'Update' : 'Publish'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            <div className="grid gap-6">
              {mlPosts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">No lessons found. Enlighten the students with a new one!</div>
              ) : mlPosts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-6 hover:shadow-md transition-shadow">
                  {post.image_url
                    ? <img src={post.image_url} alt="" className="w-40 h-28 object-cover rounded-xl bg-slate-100" />
                    : <div className="w-40 h-28 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100"><BookOpen size={32} className="text-slate-200" /></div>
                  }
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider">{post.category}</span>
                          {!post.is_published && <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">Draft</span>}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{post.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditML(post)} className="p-2 text-slate-400 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-colors"><Edit3 size={18} /></button>
                        <button onClick={() => handleDeleteML(post.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mt-3 line-clamp-2">{post.summary || 'No summary provided.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Notifications ── */}
        {activeTab === 'notifications' && (
          <>
            {showNotifForm && (
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                <h2 className="text-xl font-bold mb-6 text-slate-800">{editingNotifId ? 'Edit Notification' : 'Compose Announcement'}</h2>
                <div className="grid gap-5">
                  <div className="grid grid-cols-2 gap-5">
                    <input type="text" placeholder="Notification Title" className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-800/20" value={notifForm.title} onChange={e => setNotifForm({ ...notifForm, title: e.target.value })} />
                    <div className="flex items-center gap-2 bg-slate-50 px-3 rounded-lg border border-slate-200">
                      <Calendar size={18} className="text-slate-400" />
                      <input type="datetime-local" className="bg-transparent w-full p-2 outline-none text-sm font-medium text-slate-700" value={notifForm.scheduled_at} onChange={e => setNotifForm({ ...notifForm, scheduled_at: e.target.value })} />
                    </div>
                  </div>
                  <textarea placeholder="Notification message..." className="w-full p-3 rounded-lg border border-slate-200 h-32 focus:outline-none focus:ring-2 focus:ring-maroon-800/20" value={notifForm.content} onChange={e => setNotifForm({ ...notifForm, content: e.target.value })} />
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => { setShowNotifForm(false); setEditingNotifId(null); setNotifForm({ title: '', content: '', scheduled_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), type: 'announcement' }); }} className="px-5 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-2">
                      <X size={18} /> Cancel
                    </button>
                    <button onClick={handleSaveNotif} className="px-6 py-2.5 rounded-lg bg-maroon-800 text-white font-bold hover:bg-maroon-900 transition-colors flex items-center gap-2 shadow-lg shadow-maroon-800/20">
                      <Save size={18} /> {editingNotifId ? 'Update' : 'Schedule'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            <div className="grid gap-4">
              {notifications.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">No notifications scheduled.</div>
              ) : notifications.map(notif => {
                const isFuture = new Date(notif.scheduled_at) > new Date();
                return (
                  <div key={notif.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-5 hover:border-slate-300 transition-all">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${notif.is_sent ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Bell size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">{notif.title}</h3>
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${notif.is_sent ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {notif.is_sent ? 'Sent' : 'Scheduled'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mt-1">{notif.content}</p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-2">
                        <Calendar size={14} />
                        {format(new Date(notif.scheduled_at), 'MMM d, yyyy • HH:mm')}
                        {isFuture && <span className="text-amber-500 ml-1">(Upcoming)</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditNotif(notif)} className="p-2 text-slate-400 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => handleDeleteNotif(notif.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Moderation ── */}
        {activeTab === 'moderation' && (
          <div className="space-y-8">
            <div className="flex gap-4">
              <button onClick={() => setModSubTab('practices')} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${modSubTab === 'practices' ? 'bg-maroon-800 text-white shadow-lg shadow-maroon-800/20' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                <Newspaper size={18} /> Practices Audit
              </button>
              <button onClick={() => setModSubTab('logs')} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${modSubTab === 'logs' ? 'bg-maroon-800 text-white shadow-lg shadow-maroon-800/20' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                <ShieldCheck size={18} /> Completion Logs
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{modSubTab === 'practices' ? 'Program / Author' : 'Practice / Practitioner'}</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {modSubTab === 'practices' ? allPractices.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-extrabold text-slate-800">{item.title}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">By {item.profiles?.display_name || 'Anonymous'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-500">{format(new Date(item.created_at), 'MMM d, yyyy')}</p>
                        <p className="text-[10px] font-black text-slate-300">ID: {item.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => handleDeletePractice(item.id)} className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all" title="Delete"><Trash2 size={20} /></button>
                      </td>
                    </tr>
                  )) : allLogs.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-extrabold text-slate-800">{item.practices?.title || 'Unknown practice'}</p>
                        <p className="text-xs font-bold text-maroon-800 uppercase mt-0.5">Completed by {item.profiles?.display_name || 'Sangha Member'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-500">{format(new Date(item.created_at), 'MMM d, yyyy • HH:mm')}</p>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => handleDeleteLog(item.id)} className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all" title="Delete"><Trash2 size={20} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Settings ── */}
        {activeTab === 'settings' && (
          <div className="grid gap-10">
            {Array.from(new Set(configs.map(c => c.category))).map(cat => (
              <section key={cat}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-maroon-50 rounded-lg flex items-center justify-center text-maroon-800">
                    <Sliders size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{cat} Settings</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {configs.filter(c => c.category === cat).map(config => (
                    <div key={config.key} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800">{config.label}</h3>
                        <p className="text-xs text-slate-400 mt-1 mb-4">{config.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-black text-slate-700 outline-none focus:ring-2 focus:ring-maroon-800/10"
                          defaultValue={config.value}
                          onBlur={e => {
                            const val = parseFloat(e.target.value);
                            if (val !== config.value) handleUpdateConfig(config.key, val);
                          }}
                        />
                        {savingConfig === config.key
                          ? <div className="w-6 h-6 border-2 border-maroon-800 border-t-transparent rounded-full animate-spin" />
                          : <Save size={18} className="text-slate-200" />
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {configs.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
                No configurations found. Add rows to the <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">app_configs</code> table.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
