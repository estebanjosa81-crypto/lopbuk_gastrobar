import React from 'react';
import { Mail, Lock, Eye, EyeOff, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GoogleSignInButton } from './GoogleSignInButton';

export const RegisterForm: React.FC = () => {
  const {
    formData,
    mostrarPassword,
    cargandoAuth,
    errorAuth,
    handleRegistro,
    handleGoogleLogin,
    setFormData,
    setMostrarPassword
  } = useAuth();

  return (
    <div className="space-y-5">
      <GoogleSignInButton
        onSuccess={handleGoogleLogin}
        onError={() => {}}
        text="signup_with"
      />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">o regístrate con email</span>
        </div>
      </div>

      <form onSubmit={handleRegistro} className="space-y-5">
        {errorAuth && (
          <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded-xl px-4 py-3">
            {errorAuth}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre Completo
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition"
              placeholder="Tu nombre"
              required
              disabled={cargandoAuth}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition"
              placeholder="tu@email.com"
              required
              disabled={cargandoAuth}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={mostrarPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition"
              placeholder="••••••••"
              required
              disabled={cargandoAuth}
            />
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={cargandoAuth}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold py-3 rounded-xl hover:from-emerald-700 hover:to-green-700 transition shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {cargandoAuth ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>
    </div>
  );
};
