export const actionRegistry = new Map();

export function registerAction(actionName, handler) {
  if (actionRegistry.has(actionName)) {
    console.warn(`Action "${actionName}" is already registered. Overwriting.`);
  }
  actionRegistry.set(actionName, handler);
}

export function handleAction(actionName, event, data, context) {
  const handler = actionRegistry.get(actionName);

  if (handler) {
    return handler(event, data, context);
  }
  return false;
}
