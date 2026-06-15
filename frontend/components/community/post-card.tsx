'use client'

import React, { useState } from 'react'
import { Heart, Bookmark, MessageCircle, Send, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'
import { communityApi, formatCOP, timeAgo, ytEmbed, type CommunityPost, type CommunityComment, type PostAd } from './api'

const CAT_LABEL: Record<string, string> = { noticia: 'Noticia', video: 'Video', tutorial: 'Tutorial', app: 'App', oferta: 'Oferta' }

export function PostCard({ post, onRequireLogin, isAuthed }: { post: CommunityPost; onRequireLogin: () => void; isAuthed: boolean }) {
  const [liked, setLiked] = useState(post.liked)
  const [saved, setSaved] = useState(post.saved)
  const [likes, setLikes] = useState(post.likes)
  const [saves, setSaves] = useState(post.saves)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommunityComment[] | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [commentCount, setCommentCount] = useState(post.comments)
  const [mediaIdx, setMediaIdx] = useState(0)

  const react = async (type: 'like' | 'save') => {
    if (!isAuthed) return onRequireLogin()
    try {
      const r = await communityApi.react(post.id, type)
      if (type === 'like') { setLiked(r.active); setLikes(r.likes) } else { setSaved(r.active); setSaves(r.saves) }
    } catch { /* noop */ }
  }

  const toggleComments = async () => {
    const next = !showComments
    setShowComments(next)
    if (next && comments === null) {
      try { setComments(await communityApi.comments(post.id)) } catch { setComments([]) }
    }
  }

  const enviarComentario = async () => {
    if (!isAuthed) return onRequireLogin()
    const body = commentBody.trim()
    if (!body) return
    try {
      const c = await communityApi.comment(post.id, body)
      setComments(prev => [...(prev || []), c])
      setCommentBody('')
      setCommentCount(n => n + 1)
    } catch { /* noop */ }
  }

  const media = post.media || []
  const cur = media[mediaIdx]

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold shrink-0">
          {post.authorAvatar && post.authorAvatar.startsWith('http')
            ? <img src={post.authorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
            : (post.author || 'D').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 leading-tight">{post.author || 'Daimuz'} <span className="text-gray-400 font-normal">· {timeAgo(post.publishedAt || post.createdAt)}</span></p>
          <span className="text-[11px] uppercase tracking-wide text-cyan-700 font-semibold">{CAT_LABEL[post.category]}</span>
        </div>
      </div>

      {/* Title + body */}
      <div className="px-4 pb-3">
        <h2 className="text-lg font-bold text-gray-900">{post.title}</h2>
        {post.body && <p className="text-gray-700 mt-1 whitespace-pre-line">{post.body}</p>}
      </div>

      {/* Media */}
      {cur && (
        <div className="relative bg-black">
          {cur.mediaType === 'video'
            ? (ytEmbed(cur.url)
                ? <div className="relative w-full" style={{ paddingTop: '56.25%' }}><iframe src={ytEmbed(cur.url)!} className="absolute inset-0 w-full h-full" allowFullScreen /></div>
                : <video src={cur.url} controls className="w-full max-h-[520px]" />)
            : <img src={cur.url} alt="" className="w-full max-h-[520px] object-contain mx-auto" />}
          {media.length > 1 && (
            <>
              <button onClick={() => setMediaIdx(i => Math.max(0, i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setMediaIdx(i => Math.min(media.length - 1, i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5"><ChevronRight className="w-5 h-5" /></button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {media.map((_, i) => <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === mediaIdx ? 'bg-white' : 'bg-white/40'}`} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 px-4 py-3 text-gray-600">
        <button onClick={() => react('like')} className={`inline-flex items-center gap-1.5 ${liked ? 'text-rose-600' : 'hover:text-rose-600'}`}>
          <Heart className={`w-5 h-5 ${liked ? 'fill-rose-600' : ''}`} /> {likes}
        </button>
        <button onClick={toggleComments} className="inline-flex items-center gap-1.5 hover:text-cyan-700"><MessageCircle className="w-5 h-5" /> {commentCount}</button>
        <button onClick={() => react('save')} className={`inline-flex items-center gap-1.5 ml-auto ${saved ? 'text-amber-600' : 'hover:text-amber-600'}`}>
          <Bookmark className={`w-5 h-5 ${saved ? 'fill-amber-600' : ''}`} /> {saves}
        </button>
      </div>

      {/* Ads */}
      {post.ads && post.ads.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Producto destacado</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {post.ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
          </div>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100 p-4 space-y-3">
          <div className="flex gap-2">
            <input value={commentBody} onChange={e => setCommentBody(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarComentario()}
              placeholder={isAuthed ? 'Escribe un comentario…' : 'Inicia sesión para comentar'} className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:border-cyan-500" />
            <button onClick={enviarComentario} className="bg-cyan-600 text-white rounded-full px-3"><Send className="w-4 h-4" /></button>
          </div>
          {comments === null ? <p className="text-sm text-gray-400">Cargando…</p> :
            comments.length === 0 ? <p className="text-sm text-gray-400">Sé el primero en comentar.</p> :
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">{(c.user || '?').charAt(0).toUpperCase()}</div>
                  <div className="bg-gray-100 rounded-2xl px-3 py-1.5 text-sm">
                    <span className="font-semibold mr-1">{c.user}</span>{c.body}
                  </div>
                </div>
              ))}
            </div>}
        </div>
      )}
    </article>
  )
}

function AdCard({ ad }: { ad: PostAd }) {
  const price = ad.isOnOffer && ad.offerPrice ? ad.offerPrice : ad.salePrice
  return (
    <a href={ad.storeSlug ? `/t/${ad.storeSlug}` : '#'} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-2 hover:shadow transition">
      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
        {ad.imageUrl ? <img src={ad.imageUrl} alt={ad.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="w-5 h-5" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{ad.name}</p>
        <p className="text-xs text-gray-400 truncate">{ad.storeName}</p>
        <p className="text-sm font-bold text-gray-900">{formatCOP(Number(price))}</p>
      </div>
      <span className="text-xs font-medium text-cyan-700 shrink-0">Ver en tienda →</span>
    </a>
  )
}

export default PostCard
