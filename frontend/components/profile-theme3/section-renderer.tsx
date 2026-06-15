'use client'

import React from 'react'
import { ytEmbed } from './types'
import type { ProfileSection } from './types'

/** Renderiza una sección dinámica según su tipo. */
export function ProfileSectionRenderer({ section }: { section: ProfileSection }) {
  const c = section.content || {}

  switch (section.sectionType) {
    case 'image_text': {
      const right = c.layout === 'right'
      return (
        <div className={`flex flex-col gap-5 md:gap-8 items-center ${right ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
          {c.imageUrl && (
            <div className="w-full md:w-1/2">
              <img src={c.imageUrl} alt="" className="w-full rounded-xl object-cover" />
            </div>
          )}
          {c.text && (
            <div className="w-full md:w-1/2">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{c.text}</p>
            </div>
          )}
        </div>
      )
    }

    case 'video': {
      const embed = ytEmbed(c.url || '')
      return (
        <div>
          {c.title && <h3 className="text-lg font-bold text-gray-900 mb-3">{c.title}</h3>}
          {embed ? (
            <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingTop: '56.25%' }}>
              <iframe src={embed} title={c.title || 'Video'} className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          ) : c.url ? (
            <video src={c.url} controls className="w-full rounded-xl" />
          ) : null}
        </div>
      )
    }

    case 'gif': {
      return (
        <div className="text-center">
          {c.url && <img src={c.url} alt={c.caption || 'GIF'} className="inline-block max-w-full rounded-xl" />}
          {c.caption && <p className="text-sm text-gray-500 mt-2">{c.caption}</p>}
        </div>
      )
    }

    case 'description': {
      return (
        <div className="prose max-w-none">
          {c.title && <h3 className="text-xl font-bold text-gray-900 mb-2">{c.title}</h3>}
          {c.body && <p className="text-gray-700 leading-relaxed whitespace-pre-line">{c.body}</p>}
        </div>
      )
    }

    case 'gallery': {
      const imgs = c.images || []
      return (
        <div>
          {c.title && <h3 className="text-lg font-bold text-gray-900 mb-3">{c.title}</h3>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imgs.map((src, i) => (
              <img key={i} src={src} alt="" className="w-full aspect-square object-cover rounded-lg" />
            ))}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

export default ProfileSectionRenderer
