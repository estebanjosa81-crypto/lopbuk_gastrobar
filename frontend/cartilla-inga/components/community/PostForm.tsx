import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const PostForm: React.FC = () => {
  const { crearPublicacion } = useApp();
  const [contenido, setContenido] = useState('');

  const handlePublicar = () => {
    if (!contenido.trim()) return;
    crearPublicacion(contenido.trim());
    setContenido('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
      <h3 className="font-bold text-gray-800 mb-4">Comparte tu experiencia</h3>
      <textarea
        placeholder="¿Qué has aprendido hoy en lengua Inga? 🌿"
        className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-purple-400 focus:outline-none"
        rows={3}
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
      />
      <div className="flex justify-end mt-3">
        <button
          onClick={handlePublicar}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
          disabled={!contenido.trim()}
        >
          Publicar
        </button>
      </div>
    </div>
  );
};
