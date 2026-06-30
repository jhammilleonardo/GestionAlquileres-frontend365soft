import { type CanDeactivateFn } from '@angular/router';

/**
 * Componentes que quieren bloquear la salida cuando tienen cambios sin guardar
 * implementan esta interfaz. El guard delega en ellos la decisión (así cada
 * pantalla muestra su propio diálogo y mensaje).
 */
export interface CanComponentDeactivate {
  canDeactivate(): boolean | Promise<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  return component?.canDeactivate ? component.canDeactivate() : true;
};
