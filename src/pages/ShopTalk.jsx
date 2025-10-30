import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
// Use heroicons or lucide-react for icons
import { PlusCircle, Edit, Trash2, X } from 'lucide-react';

function isAdmin(user) {
  // DigiGet superadmin check: email ends with @digiget.uk, role=super, is_super_admin=true
  if (!user) return false;
  const email = user.email?.toLowerCase() || '';
  return (
    email.endsWith('@digiget.uk') ||
    user.user_metadata?.role === 'super' ||
    user.user_metadata?.is_super_admin === true
  );
}

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    year: 'numeric', month: 'short', day: '2-digit'
  });
}

export default function ShopTalk() {
  const { user } = useAuth ? useAuth() : { user: null };
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPost, setModalPost] = useState(null);
  const [form, setForm] = useState({ title: '', summary: '', content: '', image_url: '', author: '' });
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);
    setPosts(data || []);
    setLoading(false);
  }

  function openModal(post) {
    setModalPost(post);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setModalPost(null);
  }
  function openEdit(post) {
    setEditing(post.id);
    setForm(post);
    setShowForm(true);
  }
  function resetForm() {
    setForm({ title: '', summary: '', content: '', image_url: '', author: '' });
    setEditing(null);
    setShowForm(false);
    setImageFile(null);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    setImageFile(file);
  }

  async function saveBlog(e) {
    e.preventDefault();
    setSaving(true);
    let image_url = form.image_url;
    if (imageFile) {
      const { data, error } = await supabase
        .storage.from('blog-assets').upload(`images/${Date.now()}_${imageFile.name}`, imageFile);
      if (data && data.path) {
        const { data: urlData } = supabase
          .storage.from('blog-assets')
          .getPublicUrl(data.path);
        image_url = urlData.publicUrl;
      }
    }
    if (editing) {
      await supabase
        .from('blog_posts')
        .update({ ...form, image_url })
        .eq('id', editing);
    } else {
      await supabase.from('blog_posts').insert({ ...form, image_url });
    }
    setSaving(false);
    resetForm();
    fetchPosts();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this post?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    fetchPosts();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-2xl mx-auto pt-12 pb-4 px-4 flex flex-col items-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 text-center">ShopTalk by DigiGet</h1>
        <div className="text-base sm:text-lg text-blue-600 text-center font-medium mt-3 mb-2">Practical tips, stories, and ideas for local shops and small teams.</div>
        <hr className="border-blue-200 my-5 w-1/2 mx-auto" />
        {isAdmin(user) && (
          <button
            className="flex items-center gap-2 text-white bg-blue-700 hover:bg-blue-900 px-4 py-2 rounded-lg font-semibold mb-6 shadow"
            onClick={() => { setShowForm(true); setEditing(null); setForm({ title:'', summary:'', content:'', image_url: '', author: '' }); }}
          >
            <PlusCircle className="w-5 h-5" />
            New Article
          </button>
        )}
        {showForm && (
          <form onSubmit={saveBlog} className="w-full bg-white rounded-lg shadow-lg p-6 mb-8 space-y-4 relative">
            <h2 className="font-bold text-lg mb-2">{editing ? 'Edit Article' : 'Add New Article'}</h2>
            <div className="space-y-2">
              <input required maxLength={120}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                placeholder="Blog post title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea required maxLength={240}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 min-h-[70px]"
                placeholder="Summary (2-3 lines)" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
              <textarea required rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 min-h-[200px] font-mono"
                placeholder="Full content (markdown supported)" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              <input required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Author name" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="block" />
              {form.image_url && <img src={form.image_url} alt="cover" className="rounded max-w-full max-h-32 my-2" />}
            </div>
            <div className="flex gap-2 mt-4">
              <button disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold shadow disabled:opacity-75">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold">Cancel</button>
            </div>
          </form>
        )}
        {loading ? (
          <div className="mx-auto text-center py-10 text-blue-500">Loading articles…</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
            {posts.map(post => (
              <div
                className="group bg-white rounded-xl shadow hover:shadow-xl border-2 hover:border-blue-300 transition-all flex flex-col overflow-hidden relative"
                key={post.id}
              >
                {post.image_url && (
                  <img src={post.image_url} alt="" className="object-cover h-40 w-full" />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-xs text-gray-400 mb-2">{formatDate(post.created_at)}</div>
                  <h2 className="text-lg font-extrabold text-blue-800 line-clamp-2 mb-2">{post.title}</h2>
                  <div className="text-sm text-gray-700 mb-2 line-clamp-2">{post.summary}</div>
                  <div className="flex flex-col gap-3 mt-auto">
                    <button onClick={() => openModal(post)}
                      className="w-full bg-blue-50 text-blue-700 rounded-lg font-semibold py-2 mt-1 hover:bg-blue-100">
                      Read more
                    </button>
                    {isAdmin(user) && (
                      <div className="absolute right-3 top-3 flex gap-2">
                        <button title="Edit" className="p-1 text-blue-600 bg-blue-50 rounded hover:bg-blue-100" onClick={() => openEdit(post)}><Edit className="w-5 h-5" /></button>
                        <button title="Delete" className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100" onClick={() => handleDelete(post.id)}><Trash2 className="w-5 h-5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal for full post */}
      {modalOpen && modalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2">
          <div className="bg-white max-w-2xl w-full rounded-xl shadow-2xl overflow-auto max-h-[90vh] relative">
            <button onClick={closeModal} className="absolute top-3 right-3 bg-blue-100 hover:bg-blue-200 rounded p-1"><X className="w-6 h-6 text-blue-800" /></button>
            {modalPost.image_url && (
              <img src={modalPost.image_url} alt={modalPost.title} className="object-cover w-full h-56 rounded-t-xl" />
            )}
            <div className="p-8">
              <div className="text-xs text-gray-400 mb-2">{formatDate(modalPost.created_at)} &middot; {modalPost.author}</div>
              <h1 className="text-2xl font-extrabold text-blue-900 mb-4">{modalPost.title}</h1>
              <div className="text-gray-800 prose max-w-none whitespace-pre-line">{modalPost.content}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
