export const actionRegistry = new Map();

export function registerAction(actionName, handler) {
  // Hiljennetään varoitus, koska Vite HMR lataa main.js usein uudelleen
  // ja se aiheuttaa turhan pitkän varoituslistan konsoliin.
  actionRegistry.set(actionName, handler);
}

export function handleAction(actionName, event, data, context) {
  const handler = actionRegistry.get(actionName);

  if (handler) {
    return handler(event, data, context);
  }
  return false;
}
