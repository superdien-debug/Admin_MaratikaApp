import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { newsAdminService, type NewsArticle } from './services/newsAdminService';
import { Plus, Trash2, Edit3, Save, X, Newspaper, LogOut, Lock } from 'lucide-react';
import { format } from 'date-fns';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // News state
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<NewsArticle>>({
    title: '',
    content: '',
    excerpt: '',
    image_url: ''
  });

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
      else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (data?.role === 'admin') {
        setIsAdmin(true);
        loadNews();
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Admin check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNews = async () => {
    try {
      const data = await newsAdminService.getAll();
      setNews(data);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  const handleSave = async () => {
    try {
      const articleData = { ...form, author_id: session.user.id };
      if (editingId) {
        await newsAdminService.update(editingId, articleData);
      } else {
        await newsAdminService.create(articleData);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ title: '', content: '', excerpt: '', image_url: '' });
      loadNews();
    } catch (err) {
      alert('Failed to save article');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      await newsAdminService.delete(id);
      loadNews();
    } catch (err) {
      alert('Failed to delete article');
    }
  };

  const startEdit = (article: NewsArticle) => {
    setEditingId(article.id);
    setForm(article);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Initializing Admin...</div>
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
              <input
                type="email"
                required
                className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-maroon-800/20 outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Password</label>
              <input
                type="password"
                required
                className="w-full p-4 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-maroon-800/20 outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-maroon-800 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-maroon-900 transition-colors shadow-lg shadow-maroon-800/20 disabled:opacity-50"
            >
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

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Newspaper className="text-maroon-800" size={32} />
              Vajrayana Admin
            </h1>
            <p className="text-slate-500 mt-1">Manage community news and articles</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
              title="Logout"
            >
              <LogOut size={22} />
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setForm({ title: '', content: '', excerpt: '', image_url: '' });
                setShowForm(true);
              }}
              className="bg-maroon-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-maroon-900 transition-colors shadow-lg shadow-maroon-800/20"
            >
              <Plus size={20} /> New Article
            </button>
          </div>
        </header>

        {showForm && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-10">
            <h2 className="text-xl font-bold mb-6 text-slate-800">{editingId ? 'Edit Article' : 'Create New Article'}</h2>
            <div className="grid gap-5">
              <input
                type="text"
                placeholder="Article Title"
                className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-800/20"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Image URL"
                className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-maroon-800/20"
                value={form.image_url}
                onChange={e => setForm({ ...form, image_url: e.target.value })}
              />
              <textarea
                placeholder="Excerpt (short summary)"
                className="w-full p-3 rounded-lg border border-slate-200 h-20 focus:outline-none focus:ring-2 focus:ring-maroon-800/20"
                value={form.excerpt}
                onChange={e => setForm({ ...form, excerpt: e.target.value })}
              />
              <textarea
                placeholder="Full Content (HTML supported)"
                className="w-full p-3 rounded-lg border border-slate-200 h-64 focus:outline-none focus:ring-2 focus:ring-maroon-800/20 font-mono text-sm"
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
              />
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm({ title: '', content: '', excerpt: '', image_url: '' });
                  }}
                  className="px-5 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
                <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                  <Save size={18} /> {editingId ? 'Update' : 'Publish'}
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6">
          {news.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
              No articles found. Start by creating one!
            </div>
          ) : (
            news.map(article => (
              <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-6 hover:shadow-md transition-shadow">
                {article.image_url ? (
                  <img src={article.image_url} alt="" className="w-40 h-28 object-cover rounded-xl bg-slate-100" />
                ) : (
                  <div className="w-40 h-28 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <Newspaper size={32} className="text-slate-200" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{article.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {format(new Date(article.created_at), 'MMM d, yyyy • HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(article)} className="p-2 text-slate-400 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-colors">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDelete(article.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mt-3 line-clamp-2">{article.excerpt || 'No summary provided.'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
