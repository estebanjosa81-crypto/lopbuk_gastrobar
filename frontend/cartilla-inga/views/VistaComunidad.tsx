import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { useApp } from '../context/AppContext';
import {
  CommunityHero,
  CommunityChallenge,
  PostForm,
  PostCard,
  JoinCommunityCard
} from '../components/community';

export const VistaComunidad: React.FC = () => {
  const { usuarioAutenticado } = useAuth();
  const { volverAInicio } = useNavigation();
  const { publicaciones } = useApp();

  return (
    <div className="space-y-8 pb-8">
      <button
        onClick={volverAInicio}
        className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-2 transition"
      >
        ← Volver al inicio
      </button>

      <CommunityHero />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {!usuarioAutenticado ? (
            <JoinCommunityCard />
          ) : (
            <>
              <PostForm />
              {publicaciones.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </>
          )}
        </div>

        <div className="space-y-6">
          <CommunityChallenge />
        </div>
      </div>
    </div>
  );
};
