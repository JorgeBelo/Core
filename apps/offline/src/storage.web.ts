import { CoreState, stateSchema } from './domain';
const key = 'core-personal-offline-v1';
export async function loadState(): Promise<CoreState | null> {
  const text = localStorage.getItem(key);
  return text ? stateSchema.parse(JSON.parse(text)) : null;
}
export async function persistState(state: CoreState) {
  localStorage.setItem(key, JSON.stringify(stateSchema.parse(state)));
}
export async function loadRecovery(): Promise<CoreState | null> {
  const text = localStorage.getItem(key + '-recovery');
  return text ? stateSchema.parse(JSON.parse(text)) : null;
}
export async function restoreState(state: CoreState) {
  const text = JSON.stringify(stateSchema.parse(state));
  const previous = localStorage.getItem(key);
  if (previous) localStorage.setItem(key + '-recovery', previous);
  localStorage.setItem(key, text);
}
