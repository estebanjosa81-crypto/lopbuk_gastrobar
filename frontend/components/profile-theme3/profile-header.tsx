'use client'

import React from 'react'
import { Instagram, MessageCircle, Globe, BadgeCheck } from 'lucide-react'
import type { ProfileData } from './types'

/** Banner + foto de perfil + nombre + tagline + links sociales. */
export function ProfileHeader({ profile }: { profile: ProfileData }) {
  const accent = profile.accentColor || '#10b981'
  const waLink = profile.whatsapp
    ? `https://wa.me/${profile.whatsapp.replace(/[^\d]/g, '')}`
    : null
  const igLink = profile.instagram
    ? (profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace(/^@/, '')}`)
    : null
  const webLink = profile.website
    ? (profile.website.startsWith('http') ? profile.website : `https://${profile.website}`)
    : null

  return (
    <div className="bg-white">
      {/* Banner */}
      <div className="relative h-44 sm:h-60 md:h-72 w-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
        {profile.coverUrl
          ? <img src={profile.coverUrl} alt="Portada" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${accent}, #0f172a)` }} />}
      </div>

      {/* Cabecera: foto + nombre + links */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14 pb-5">
          <div className="shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-white bg-white overflow-hidden shadow-lg">
              {profile.profilePhotoUrl
                ? <img src={profile.profilePhotoUrl} alt={profile.displayName || 'Perfil'} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: accent }}>
                    {(profile.displayName || '?').charAt(0).toUpperCase()}
                  </div>}
            </div>
          </div>

          <div className="flex-1 min-w-0 sm:pb-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              {profile.displayName || 'Negocio'}
              {profile.isPublished && <BadgeCheck className="w-5 h-5" style={{ color: accent }} />}
            </h1>
            {profile.tagline && <p className="text-gray-600 mt-0.5">{profile.tagline}</p>}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {igLink && (
                <a href={igLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              )}
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white" style={{ background: '#25D366' }}>
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {webLink && (
                <a href={webLink} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-800">
                  <Globe className="w-4 h-4" /> Sitio web
                </a>
              )}
            </div>
          </div>
        </div>

        {profile.aboutText && (
          <div className="pb-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{profile.aboutText}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileHeader
