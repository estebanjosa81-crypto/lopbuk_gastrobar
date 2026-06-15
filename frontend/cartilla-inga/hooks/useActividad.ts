import { useApp } from '../context/AppContext';

export const useActividad = () => {
  const {
    respuestaSeleccionada,
    mostrarResultado,
    paresSeleccionados,
    palabraActiva,
    moduloActual,
    verificarRespuesta,
    seleccionarPalabra,
    reiniciarActividad,
  } = useApp();

  return {
    // Estado
    respuestaSeleccionada,
    mostrarResultado,
    paresSeleccionados,
    palabraActiva,
    actividad: moduloActual?.actividad || null,

    // Acciones
    verificarRespuesta,
    seleccionarPalabra,
    reiniciarActividad,
  };
};
