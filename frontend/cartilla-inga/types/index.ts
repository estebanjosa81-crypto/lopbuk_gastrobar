import type { FormEvent } from 'react';

// ============= TIPOS DE ACTIVIDADES =============
export interface ActividadCompletar {
  tipo: 'completar';
  pregunta: string;
  respuestaCorrecta: string;
  opciones: string[];
}

export interface ParEmparejar {
  inga: string;
  espanol: string;
  id: number;
}

export interface ActividadEmparejar {
  tipo: 'emparejar';
  pregunta: string;
  pares: ParEmparejar[];
}

export type Actividad = ActividadCompletar | ActividadEmparejar;

// ============= TIPOS DE MÓDULOS =============
export type ColorModulo = 'emerald' | 'green' | 'amber' | 'purple' | 'pink';

export interface Modulo {
  id: number;
  clave: string;
  titulo: string;
  icono: string;
  color: ColorModulo;
  descripcion: string;
  videoUrl: string;
  frase: string;
  traduccion: string;
  actividad: Actividad;
}

export type ModuloKey = string;

// ============= TIPOS DE USUARIO Y COMUNIDAD =============
export interface UsuarioComunidad {
  id: number;
  nombre: string;
  avatar: string;
  puntos: number;
  nivel: string;
  frase?: string;
}

export interface Publicacion {
  id: number;
  usuario: string;
  avatar: string;
  contenido: string;
  likes: number;
  comentarios: number;
  creado_en: string;
}

export type DificultadReto = 'facil' | 'medio' | 'dificil';
export type CategoriaReto = 'vocabulario' | 'conversacion' | 'modulo' | 'comunidad';

export interface RetoDiario {
  id: number;
  titulo: string;
  descripcion: string;
  puntos: number;
  completado: boolean;
  dificultad: DificultadReto;
  categoria: CategoriaReto;
  progreso?: number;
  meta?: number;
  actual?: number;
}

// ============= TIPOS DE AUTENTICACIÓN =============
export interface FormDataAuth {
  email: string;
  password: string;
  nombre: string;
}

export type VistaAuth = 'login' | 'registro';

// ============= TIPOS DE ROLES =============
export type UserRole = 'user' | 'admin';

// ============= TIPOS DE NAVEGACIÓN =============
export type VistaActual = 'inicio' | 'modulo' | 'comunidad' | 'auth' | 'admin' | 'traductor';

// ============= TIPOS DE ESTADO DE ACTIVIDAD =============
export interface PalabraActiva {
  palabra: string;
  tipo: 'inga' | 'espanol';
}

// ============= TIPOS DE CONTEXTO =============
export interface AppState {
  // Auth
  usuarioAutenticado: boolean;
  vistaAuth: VistaAuth;
  mostrarPassword: boolean;
  formData: FormDataAuth;
  mostrarModalAuth: boolean;
  mostrarModalStats: boolean;
  cargando: boolean;
  cargandoAuth: boolean;
  errorAuth: string | null;

  // Navegación
  vistaActual: VistaActual;
  moduloActivo: ModuloKey;
  menuAbierto: boolean;

  // Data from API
  modulos: Modulo[];
  topUsuarios: UsuarioComunidad[];
  publicaciones: Publicacion[];
  miembrosActivos: number;

  // Actividades
  respuestaSeleccionada: string | null;
  mostrarResultado: boolean;
  paresSeleccionados: string[];
  palabraActiva: PalabraActiva | null;

  // Puntos y estadísticas del usuario
  puntos: number;
  diasSeguidos: number;
  palabrasAprendidas: number;

  // Retos
  retos: RetoDiario[];

  // Rol del usuario autenticado
  userRole: UserRole | null;
}

export interface AppActions {
  // Auth
  handleLogin: (e: FormEvent) => void;
  handleRegistro: (e: FormEvent) => void;
  handleLogout: () => void;
  handleGoogleLogin: (credential: string) => void;
  solicitarAutenticacion: () => void;
  setVistaAuth: (vista: VistaAuth) => void;
  setMostrarPassword: (mostrar: boolean) => void;
  setFormData: (data: FormDataAuth) => void;
  setMostrarModalStats: (mostrar: boolean) => void;

  // Navegación
  irAModulo: (modulo: ModuloKey) => void;
  volverAInicio: () => void;
  irAComunidad: () => void;
  irAAdmin: () => void;
  irATraductor: () => void;
  setMenuAbierto: (abierto: boolean) => void;

  // Comunidad
  crearPublicacion: (contenido: string) => void;
  toggleLike: (id: number) => void;

  // Actividades
  verificarRespuesta: (opcion: string) => void;
  seleccionarPalabra: (palabra: string, tipo: 'inga' | 'espanol') => void;
  reiniciarActividad: () => void;
}

export interface AppContextType extends AppState, AppActions {
  moduloActual: Modulo | null;
}
