import { useApp } from '../context/AppContext';

export const useNavigation = () => {
  const {
    vistaActual,
    moduloActivo,
    menuAbierto,
    moduloActual,
    irAModulo,
    volverAInicio,
    irAComunidad,
    irAAdmin,
    irATraductor,
    setMenuAbierto,
  } = useApp();

  return {
    vistaActual,
    moduloActivo,
    menuAbierto,
    moduloActual,
    irAModulo,
    volverAInicio,
    irAComunidad,
    irAAdmin,
    irATraductor,
    setMenuAbierto,
  };
};
