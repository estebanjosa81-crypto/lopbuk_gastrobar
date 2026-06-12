'use client'

import { CheckCircle2, Package, Pin, Plus, RefreshCw, Search, Sparkles, Star, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCOP } from '@/lib/utils'
import { useFeaturedProducts } from '../hooks/useFeaturedProducts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export function FeaturedProductsTab() {
  const {
    featuredProducts, isLoadingFeatured, featuredSearch, searchResults, isSearching,
    handleFeaturedSearch, addToFeatured, removeFromFeatured,
  } = useFeaturedProducts()

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
            <Pin className="h-5 w-5 text-amber-500" />
            Productos Destacados en la Página Principal
          </CardTitle>
          <CardDescription>
            Estos productos se muestran de forma prominente en la landing page, antes de las tiendas.
            El admin puede pinear productos de cualquier comercio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={featuredSearch}
              onChange={(e) => handleFeaturedSearch(e.target.value)}
              placeholder="Buscar producto para destacar (nombre, marca...)..."
              className="pl-9 pr-4"
            />
            {isSearching && (
              <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="border border-border rounded-lg bg-background shadow-lg divide-y divide-border max-h-64 overflow-y-auto">
              {searchResults.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => addToFeatured(product)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 shrink-0 rounded bg-muted overflow-hidden">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL.replace('/api', '')}${product.imageUrl}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : <Package className="h-5 w-5 m-auto text-muted-foreground/30 mt-2.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.storeName || product.brand || ''} · {formatCOP(product.salePrice)}</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Current featured */}
          {isLoadingFeatured ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed border-border rounded-lg">
              <Star className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">No hay productos destacados</p>
              <p className="text-xs mt-1">Busca y añade productos de cualquier tienda</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                {featuredProducts.length} producto(s) destacado(s) — se muestran primero en la landing
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {featuredProducts.map((product: any) => (
                  <div key={product.id} className="relative flex gap-3 p-3 border border-border rounded-lg bg-background group">
                    <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl.startsWith('http') ? product.imageUrl : `${API_URL.replace('/api', '')}${product.imageUrl}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Sparkles className="h-5 w-5 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{product.storeName || product.brand || ''}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {product.isOnOffer && product.offerPrice ? (
                          <>
                            <span className="text-sm font-semibold text-orange-500">{formatCOP(product.offerPrice)}</span>
                            <span className="text-xs text-muted-foreground line-through">{formatCOP(product.salePrice)}</span>
                          </>
                        ) : (
                          <span className="text-sm font-semibold text-foreground">{formatCOP(product.salePrice)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromFeatured(product.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute top-2 left-2">
                      <Pin className="h-3 w-3 text-amber-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
