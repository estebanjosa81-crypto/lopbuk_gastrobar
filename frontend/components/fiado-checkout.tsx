'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import { type CustomerFull } from '@/lib/types'
import { formatCOP } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Search,
  Plus,
  User,
  AlertCircle,
  DollarSign,
  Phone,
  Mail,
  Check,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface FiadoCheckoutProps {
  onComplete?: () => void
  onClose?: () => void
  showHeader?: boolean
}

export function FiadoCheckout({ onComplete, onClose, showHeader = true }: FiadoCheckoutProps) {
  const { cart, clearCart, addSale, selectedCustomer, setSelectedCustomer } = useStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Estados para búsqueda de cliente
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerFull[]>([])
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false)
  const [isNewCustomerFormOpen, setIsNewCustomerFormOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ cedula: '', name: '', phone: '', email: '', address: '' })

  // Para confirmar fiado
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')

  // Límite de crédito y días de plazo desde localStorage
  const [creditLimit, setCreditLimit] = useState(0)
  const [creditDays, setCreditDays] = useState(30)
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fiado.maxLimit')
      if (saved) setCreditLimit(Number(saved))
      const savedDays = localStorage.getItem('fiado.dueDays')
      if (savedDays) setCreditDays(Number(savedDays) || 30)
    }
  })

  // Cálculos
  const subtotal = cart.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0)
  const tax = subtotal * 0.19
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount, 0)
  const total = subtotal + tax - totalDiscount

  // Validación de límite de crédito
  const currentBalance = selectedCustomer?.balance || 0
  const newTotalDebt = currentBalance + total
  const exceedsLimit = creditLimit > 0 && newTotalDebt > creditLimit
  const availableCredit = creditLimit > 0 ? Math.max(0, creditLimit - currentBalance) : Infinity

  // Búsqueda de clientes
  const handleSearchCustomers = async (query: string) => {
    setCustomerSearchQuery(query)
    if (query.length < 2) {
      setCustomerSearchResults([])
      return
    }
    setIsSearchingCustomers(true)
    const result = await api.searchCustomers(query)
    if (result.success && result.data) {
      setCustomerSearchResults(result.data)
    }
    setIsSearchingCustomers(false)
  }

  const handleSelectCustomer = (cust: CustomerFull) => {
    setSelectedCustomer(cust)
    setIsCustomerSearchOpen(false)
    setCustomerSearchQuery('')
    setCustomerSearchResults([])
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.cedula) return
    const result = await api.createCustomer(newCustomer)
    if (result.success && result.data) {
      const createdCustomer: CustomerFull = {
        ...result.data,
        totalCredit: 0,
        totalPaid: 0,
        balance: 0,
      }
      setSelectedCustomer(createdCustomer)
      setIsNewCustomerFormOpen(false)
      setIsCustomerSearchOpen(false)
      setNewCustomer({ cedula: '', name: '', phone: '', email: '', address: '' })
    }
  }

  const handleConfirmFiado = () => {
    if (!selectedCustomer || cart.length === 0) {
      return
    }
    let message = `¿Desea registrar esta venta de ${formatCOP(total)} a fiado para ${selectedCustomer.name}?`
    if (currentBalance > 0) {
      message += `\n\nDeuda actual: ${formatCOP(currentBalance)}\nNueva deuda total: ${formatCOP(newTotalDebt)}`
    }
    if (exceedsLimit) {
      message += `\n\n⚠️ ADVERTENCIA: El cliente excederá el límite de crédito de ${formatCOP(creditLimit)}`
    }
    setConfirmMessage(message)
    setIsConfirmOpen(true)
  }

  const handleCompleteFiado = async () => {
    setIsProcessing(true)
    setIsConfirmOpen(false)

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      discount: item.discount,
    }))

    const customerName = selectedCustomer?.name || ''
    const saleTotal = total

    const result = await addSale({
      items: saleItems,
      paymentMethod: 'fiado',
      amountPaid: 0,
      customerId: selectedCustomer?.id,
      customerName: customerName,
      customerPhone: selectedCustomer?.phone,
      creditDays,
    })

    setIsProcessing(false)

    if (result.success) {
      setSuccessMessage(`Fiado de ${formatCOP(saleTotal)} registrado para ${customerName}`)
      clearCart()
      setSelectedCustomer(null)
      // Cerrar después de mostrar el mensaje
      setTimeout(() => {
        setSuccessMessage(null)
        onComplete?.()
        onClose?.()
      }, 2000)
    }
  }

  // Mostrar pantalla de éxito
  if (successMessage) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">¡Fiado Registrado!</h3>
        <p className="text-muted-foreground text-center">{successMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="border-b border-border pb-4">
          <h2 className="text-xl font-bold text-foreground">Venta a Fiado</h2>
          <p className="text-muted-foreground text-sm">Selecciona el cliente y confirma el fiado</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Cliente - Primero en mobile */}
        <div className="w-full">
          {/* Cliente Seleccionado */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {selectedCustomer ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-primary bg-primary/5 p-2 sm:p-3">
                    <p className="font-semibold text-sm text-foreground">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {selectedCustomer.phone}
                      </p>
                    )}
                    {currentBalance > 0 && (
                      <div className="mt-2 p-1.5 bg-destructive/10 rounded-md">
                        <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Deuda: {formatCOP(currentBalance)}
                        </p>
                      </div>
                    )}
                    {exceedsLimit && (
                      <div className="mt-1.5 p-1.5 bg-orange-500/10 border border-orange-500/30 rounded-md">
                        <p className="text-xs font-semibold text-orange-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          ¡Excede límite!
                        </p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => setIsCustomerSearchOpen(true)}
                  >
                    Cambiar Cliente
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => setIsCustomerSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                  Seleccionar Cliente
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carrito */}
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Detalle de la Venta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No hay productos en la venta
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agrega productos desde el POS
                  </p>
                </div>
              ) : (
                <>
                  {/* Items */}
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="rounded-lg border border-border bg-secondary/30 p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} × {formatCOP(item.product.salePrice)} = {formatCOP(item.product.salePrice * item.quantity)}
                            </p>
                          </div>
                          {item.discount > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-destructive">
                                Desc: {formatCOP(item.discount)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCOP(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descuentos</span>
                      <span className="font-medium text-destructive">-{formatCOP(totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA (19%)</span>
                      <span className="font-medium">{formatCOP(tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                      <span>Total a Fiar</span>
                      <span className="text-primary">{formatCOP(total)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Botón Registrar Fiado */}
        {selectedCustomer && cart.length > 0 && (
          <Button
            className="w-full h-10"
            onClick={handleConfirmFiado}
            disabled={isProcessing}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            {isProcessing ? 'Registrando...' : 'Registrar Fiado'}
          </Button>
        )}
      </div>

      {/* Customer Search Dialog */}
      <Dialog open={isCustomerSearchOpen} onOpenChange={setIsCustomerSearchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Seleccionar Cliente
            </DialogTitle>
            <DialogDescription>
              Busque un cliente existente o cree uno nuevo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={customerSearchQuery}
                onChange={(e) => handleSearchCustomers(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {isSearchingCustomers ? (
              <div className="text-center py-4 text-muted-foreground">
                Buscando...
              </div>
            ) : customerSearchResults.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customerSearchResults.map((cust) => (
                  <div
                    key={cust.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectCustomer(cust)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{cust.name}</p>
                        {cust.phone && (
                          <p className="text-xs text-muted-foreground">{cust.phone}</p>
                        )}
                      </div>
                    </div>
                    {cust.balance > 0 && (
                      <Badge variant="destructive" className="text-xs ml-2">
                        Debe: {formatCOP(cust.balance)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : customerSearchQuery.length >= 2 ? (
              <div className="text-center py-4 text-muted-foreground">
                No se encontraron clientes
              </div>
            ) : null}

            {/* Create New Customer Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsNewCustomerFormOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Customer Form Dialog */}
      <Dialog open={isNewCustomerFormOpen} onOpenChange={setIsNewCustomerFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Cliente
            </DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cédula <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Número de cédula"
                value={newCustomer.cedula}
                onChange={(e) => setNewCustomer({ ...newCustomer, cedula: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Nombre completo"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                placeholder="Número de teléfono"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                placeholder="Dirección (opcional)"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCustomerFormOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCustomer} disabled={!newCustomer.name || !newCustomer.cedula}>
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Fiado Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Venta a Fiado</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {confirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteFiado} disabled={isProcessing}>
              {isProcessing ? 'Registrando...' : 'Confirmar Fiado'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
