import React from 'react';
import { ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import { Publicacion } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  post: Publicacion;
}

const tiempoRelativo = (fecha: string): string => {
  const diff = Date.now() - new Date(fecha).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} horas`;
  const dias = Math.floor(hrs / 24);
  return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
};

export const PostCard: React.FC<Props> = ({ post }) => {
  const { toggleLike } = useApp();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-purple-300 transition">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{post.avatar}</div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-800">{post.usuario}</h4>
          <p className="text-sm text-gray-500">{tiempoRelativo(post.creado_en)}</p>
        </div>
      </div>

      <p className="text-gray-700 mb-4 leading-relaxed">{post.contenido}</p>

      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
        <button onClick={() => toggleLike(post.id)} className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition group">
          <ThumbsUp className="w-5 h-5 group-hover:scale-110 transition" />
          <span className="font-medium">{post.likes}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition group">
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition" />
          <span className="font-medium">{post.comentarios}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition group">
          <Share2 className="w-5 h-5 group-hover:scale-110 transition" />
          <span className="font-medium">Compartir</span>
        </button>
      </div>
    </div>
  );
};
