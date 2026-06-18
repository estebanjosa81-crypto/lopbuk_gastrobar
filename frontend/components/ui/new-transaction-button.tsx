'use client'

import React from 'react'

/**
 * Widget animado de "Nueva transacción / Suscripción".
 * Crédito del diseño original: Uiverse.io by Admin12121.
 *
 * Los estilos viven en globals.css bajo `.nt-container` (todas las clases con
 * prefijo `nt-`) para no colisionar con clases genéricas (.card, .screen, etc.).
 */
interface Props extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
}

export function NewTransactionButton({ label = 'Nueva suscripción', className = '', onClick, ...props }: Props) {
  return (
    <div
      {...props}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
        }
      }}
      className={`nt-container ${className}`}
    >
      <div className="nt-left">
        <div className="nt-card">
          <div className="nt-card-line" />
          <div className="nt-buttons" />
        </div>
        <div className="nt-post">
          <div className="nt-post-line" />
          <div className="nt-screen">
            <div className="nt-dollar">$</div>
          </div>
          <div className="nt-numbers" />
          <div className="nt-numbers-line2" />
        </div>
      </div>
      <div className="nt-right">
        <div className="nt-new">{label}</div>
        <svg viewBox="0 0 451.846 451.847" height="512" width="512" xmlns="http://www.w3.org/2000/svg" className="nt-arrow" aria-hidden="true">
          <path fill="#cfcfcf" d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z" />
        </svg>
      </div>
    </div>
  )
}
