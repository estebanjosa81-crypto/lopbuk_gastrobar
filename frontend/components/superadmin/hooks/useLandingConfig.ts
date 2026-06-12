'use client'

import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { clearCloudinaryCache } from '@/components/ui/cloudinary-upload'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface Drop {
  id: number
  name: string
  description?: string
  bannerUrl?: string
  globalDiscount: number
  startsAt: string
  endsAt: string
  isActive: boolean
}

const emptyDrop = (): Omit<Drop, 'id'> => ({
  name: '', description: '', bannerUrl: '', globalDiscount: 0,
  startsAt: '', endsAt: '', isActive: true,
})

export function useLandingConfig() {
  // Hero
  const [heroUrl, setHeroUrl] = useState('')
  const [heroTitle, setHeroTitle] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [isSavingHero, setIsSavingHero] = useState(false)

  // Login image
  const [loginImageUrl, setLoginImageUrl] = useState('')
  const [isSavingLogin, setIsSavingLogin] = useState(false)

  // Theme
  const [panelTheme, setPanelTheme] = useState<'classic' | 'comerciante'>('classic')
  const [isSavingTheme, setIsSavingTheme] = useState(false)

  // Offers
  const [offers, setOffers] = useState<any[]>([])
  const [isLoadingOffers, setIsLoadingOffers] = useState(false)

  // Drops
  const [drops, setDrops] = useState<Drop[]>([])
  const [isLoadingDrops, setIsLoadingDrops] = useState(false)
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false)
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null)
  const [dropForm, setDropForm] = useState<Omit<Drop, 'id'>>(emptyDrop())
  const [isSavingDrop, setIsSavingDrop] = useState(false)
  const [deletingDropId, setDeletingDropId] = useState<number | null>(null)

  const fetchPlatformSettings = useCallback(async () => {
    const result = await api.getPlatformSettings()
    if (result.success && result.data) {
      if (result.data.hero_image_url) setHeroUrl(result.data.hero_image_url)
      if (result.data.hero_title) setHeroTitle(result.data.hero_title)
      if (result.data.hero_subtitle) setHeroSubtitle(result.data.hero_subtitle)
      if (result.data.login_image_url) setLoginImageUrl(result.data.login_image_url)
      if (result.data.panel_theme === 'comerciante' || result.data.panel_theme === 'classic') {
        setPanelTheme(result.data.panel_theme)
      }
    }
  }, [])

  const fetchOffers = useCallback(async () => {
    setIsLoadingOffers(true)
    try {
      const res = await fetch(`${API_URL}/storefront/products?limit=100&store=all`)
      const json = await res.json()
      if (json.success && json.data?.products) {
        setOffers(json.data.products.filter((p: any) => p.isOnOffer))
      }
    } catch { /* silent */ }
    setIsLoadingOffers(false)
  }, [])

  const fetchDrops = useCallback(async () => {
    setIsLoadingDrops(true)
    try {
      const res = await fetch(`${API_URL}/storefront/drops`, {
        headers: { Authorization: `Bearer ${api.getToken()}` },
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) setDrops(json.data)
      else if (Array.isArray(json)) setDrops(json)
    } catch { /* silent */ }
    setIsLoadingDrops(false)
  }, [])

  useEffect(() => {
    fetchPlatformSettings()
    fetchOffers()
    fetchDrops()
  }, [fetchPlatformSettings, fetchOffers, fetchDrops])

  const handleSaveHero = async () => {
    setIsSavingHero(true)
    try {
      const results = await Promise.all([
        api.updatePlatformSetting('hero_image_url', heroUrl),
        api.updatePlatformSetting('hero_title', heroTitle),
        api.updatePlatformSetting('hero_subtitle', heroSubtitle),
      ])
      if (results.every(r => r.success)) toast.success('Hero principal actualizado')
      else toast.error('Error al guardar algunos campos')
    } catch { toast.error('Error de conexión') }
    setIsSavingHero(false)
  }

  const handleSaveLoginImage = async () => {
    setIsSavingLogin(true)
    const result = await api.updatePlatformSetting('login_image_url', loginImageUrl)
    if (result.success) toast.success('Imagen del login actualizada')
    else toast.error(result.error || 'Error al guardar')
    setIsSavingLogin(false)
  }

  const handleSavePanelTheme = async (value: 'classic' | 'comerciante') => {
    setIsSavingTheme(true)
    const prev = panelTheme
    setPanelTheme(value)
    const result = await api.updatePlatformSetting('panel_theme', value)
    if (result.success) {
      try { localStorage.setItem('panel_theme', value) } catch { /* ignore */ }
      toast.success(value === 'comerciante' ? 'Tema 2 (Panel Comerciante) activado' : 'Tema clásico activado')
    } else {
      setPanelTheme(prev)
      toast.error(result.error || 'Error al guardar el tema')
    }
    setIsSavingTheme(false)
  }

  const openCreateDrop = () => { setEditingDrop(null); setDropForm(emptyDrop()); setIsDropDialogOpen(true) }

  const openEditDrop = (drop: Drop) => {
    setEditingDrop(drop)
    setDropForm({
      name: drop.name, description: drop.description || '', bannerUrl: drop.bannerUrl || '',
      globalDiscount: drop.globalDiscount,
      startsAt: drop.startsAt ? drop.startsAt.slice(0, 16) : '',
      endsAt: drop.endsAt ? drop.endsAt.slice(0, 16) : '',
      isActive: drop.isActive,
    })
    setIsDropDialogOpen(true)
  }

  const handleSaveDrop = async () => {
    if (!dropForm.name || !dropForm.startsAt || !dropForm.endsAt) {
      toast.error('Nombre, fecha de inicio y fin son requeridos'); return
    }
    setIsSavingDrop(true)
    const payload = {
      name: dropForm.name, description: dropForm.description || undefined,
      bannerUrl: dropForm.bannerUrl || undefined,
      globalDiscount: Number(dropForm.globalDiscount),
      startsAt: dropForm.startsAt, endsAt: dropForm.endsAt, isActive: dropForm.isActive,
    }
    const result = editingDrop ? await api.updateDrop(editingDrop.id, payload) : await api.createDrop(payload)
    if (result.success) { toast.success(editingDrop ? 'Drop actualizado' : 'Drop creado'); setIsDropDialogOpen(false); fetchDrops() }
    else toast.error(result.error || 'Error al guardar drop')
    setIsSavingDrop(false)
  }

  const handleDeleteDrop = async (id: number) => {
    const result = await api.deleteDrop(id)
    if (result.success) { toast.success('Drop eliminado'); setDeletingDropId(null); fetchDrops() }
    else toast.error(result.error || 'Error al eliminar')
  }

  return {
    // hero
    heroUrl, setHeroUrl, heroTitle, setHeroTitle, heroSubtitle, setHeroSubtitle,
    isSavingHero, handleSaveHero,
    // login
    loginImageUrl, setLoginImageUrl, isSavingLogin, handleSaveLoginImage,
    // theme
    panelTheme, isSavingTheme, handleSavePanelTheme,
    // offers
    offers, isLoadingOffers, fetchOffers,
    // drops
    drops, isLoadingDrops, fetchDrops,
    isDropDialogOpen, setIsDropDialogOpen,
    editingDrop, dropForm, setDropForm,
    isSavingDrop, deletingDropId, setDeletingDropId,
    openCreateDrop, openEditDrop, handleSaveDrop, handleDeleteDrop,
  }
}
