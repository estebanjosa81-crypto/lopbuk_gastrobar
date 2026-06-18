import React from 'react';
import { Book, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const AuthContent: React.FC = () => {
  const { vistaAuth, setVistaAuth } = useAuth();
  const { vistaActual, volverAInicio } = useNavigation();

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo y título */}
      <div className="text-center mb-8">
        <div className="inline-block bg-white/20 backdrop-blur p-4 rounded-2xl mb-4">
          <Book className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Cartilla Digital Inga</h1>
        <p className="text-emerald-100">Preservando nuestra lengua ancestral</p>
      </div>

      {/* Card de Login/Registro */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex bg-gray-100">
          <button
            onClick={() => setVistaAuth('login')}
            className={`flex-1 py-4 font-bold transition ${
              vistaAuth === 'login'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => setVistaAuth('registro')}
            className={`flex-1 py-4 font-bold transition ${
              vistaAuth === 'registro'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Formularios */}
        <div className="p-8">
          {vistaAuth === 'login' ? <LoginForm /> : <RegisterForm />}

          {/* Mensaje motivacional */}
          <div className="mt-6 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
            <p className="text-sm text-emerald-800 text-center">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Crea una cuenta para guardar tu progreso y ganar puntos mientras aprendes
            </p>
          </div>

          {/* Botón para volver si está en vista auth */}
          {vistaActual === 'auth' && (
            <button
              onClick={volverAInicio}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Continuar sin cuenta
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
