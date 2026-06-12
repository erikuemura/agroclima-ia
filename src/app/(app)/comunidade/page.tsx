'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Users, Heart, MessageCircle, Send, Radar } from 'lucide-react'
import { getDemoProfileClient } from '@/lib/demo-profiles'
import { readPosts, writePosts, type CommunityPost, type PostCategory } from '@/lib/stores'

const CAT_META: Record<PostCategory, { label: string; emoji: string; color: string }> = {
  praga:   { label: 'Praga',   emoji: '🐛', color: 'bg-red-100 text-red-700' },
  doença:  { label: 'Doença',  emoji: '🍂', color: 'bg-orange-100 text-orange-700' },
  clima:   { label: 'Clima',   emoji: '🌧', color: 'bg-blue-100 text-blue-700' },
  mercado: { label: 'Mercado', emoji: '💰', color: 'bg-green-100 text-green-700' },
  geral:   { label: 'Geral',   emoji: '💬', color: 'bg-stone-100 text-stone-600' },
}

export default function ComunidadePage() {
  const profile = getDemoProfileClient()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [text, setText] = useState('')
  const [category, setCategory] = useState<PostCategory>('geral')
  const [commenting, setCommenting] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  useEffect(() => { setPosts(readPosts()) }, [])

  // Radar regional: ocorrências de praga/doença agregadas por categoria
  const radar = useMemo(() => {
    const occ = posts.filter(p => p.category === 'praga' || p.category === 'doença')
    const byCat = new Map<string, number>()
    occ.forEach(p => {
      const k = p.text.toLowerCase().includes('percevejo') ? 'Percevejo'
        : p.text.toLowerCase().includes('ferrugem') ? 'Ferrugem asiática'
        : p.text.toLowerCase().includes('lagarta') ? 'Lagarta'
        : p.category === 'praga' ? 'Outras pragas' : 'Outras doenças'
      byCat.set(k, (byCat.get(k) ?? 0) + 1)
    })
    return [...byCat.entries()].sort((a, b) => b[1] - a[1])
  }, [posts])

  function publish() {
    if (!text.trim()) return
    const post: CommunityPost = {
      id: String(Date.now()),
      author: `${profile.avatar} (você)`,
      city: profile.farm.city,
      state: profile.farm.state,
      category,
      text: text.trim(),
      likes: 0,
      comments: [],
      createdAt: new Date().toISOString().slice(0, 10),
    }
    const next = [post, ...posts]
    setPosts(next); writePosts(next)
    setText('')
  }

  function toggleLike(id: string) {
    const next = posts.map(p => p.id === id
      ? { ...p, likes: p.likedByMe ? p.likes - 1 : p.likes + 1, likedByMe: !p.likedByMe }
      : p)
    setPosts(next); writePosts(next)
  }

  function addComment(id: string) {
    if (!comment.trim()) return
    const next = posts.map(p => p.id === id
      ? { ...p, comments: [...p.comments, { author: `${profile.avatar} (você)`, text: comment.trim() }] }
      : p)
    setPosts(next); writePosts(next)
    setComment(''); setCommenting(null)
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-stone-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-700" /> Comunidade de produtores
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">Região de {profile.farm.city}/{profile.farm.state}</p>
      </div>

      {/* Radar regional */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radar className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-medium text-stone-700">Radar regional — ocorrências reportadas</h3>
        </div>
        {radar.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {radar.map(([name, count]) => (
              <span key={name} className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-full">
                {name}: <strong>{count}</strong> relato(s) na região
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-400">Sem ocorrências reportadas na sua região nos últimos dias.</p>
        )}
      </Card>

      {/* Nova postagem */}
      <Card className="p-4">
        <div className="flex gap-2 mb-2 flex-wrap">
          {(Object.keys(CAT_META) as PostCategory[]).map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                category === c ? 'bg-green-700 text-white border-green-700' : 'bg-white text-stone-500 border-stone-200'
              }`}>
              {CAT_META[c].emoji} {CAT_META[c].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && publish()}
            placeholder="Compartilhe uma ocorrência ou dica com os produtores da região…"
            className="flex-1 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <button onClick={publish}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Feed */}
      <div className="space-y-3">
        {posts.map(p => {
          const meta = CAT_META[p.category]
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="w-7 h-7 rounded-full bg-green-100 text-green-800 text-[10px] font-semibold flex items-center justify-center">
                  {p.author.slice(0, 2).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-700">{p.author}</p>
                  <p className="text-[10px] text-stone-400">{p.city}/{p.state} · {new Date(p.createdAt + 'T12:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${meta.color}`}>{meta.emoji} {meta.label}</span>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed mb-3">{p.text}</p>
              <div className="flex items-center gap-4">
                <button onClick={() => toggleLike(p.id)}
                  className={`flex items-center gap-1 text-xs transition-colors ${p.likedByMe ? 'text-red-500' : 'text-stone-400 hover:text-red-400'}`}>
                  <Heart className={`w-3.5 h-3.5 ${p.likedByMe ? 'fill-red-500' : ''}`} /> {p.likes}
                </button>
                <button onClick={() => setCommenting(commenting === p.id ? null : p.id)}
                  className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> {p.comments.length}
                </button>
              </div>

              {p.comments.length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-2.5">
                  {p.comments.map((c, i) => (
                    <p key={i} className="text-xs text-stone-500">
                      <strong className="text-stone-600">{c.author}:</strong> {c.text}
                    </p>
                  ))}
                </div>
              )}

              {commenting === p.id && (
                <div className="flex gap-2 mt-2.5">
                  <input value={comment} onChange={e => setComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment(p.id)} autoFocus
                    placeholder="Escreva um comentário…"
                    className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <button onClick={() => addComment(p.id)}
                    className="bg-green-700 text-white text-xs px-3 rounded-lg hover:bg-green-800">Enviar</button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <p className="text-[9px] text-stone-300 text-center">
        Conteúdo da comunidade é compartilhado entre produtores e não substitui orientação agronômica profissional.
      </p>
    </div>
  )
}
