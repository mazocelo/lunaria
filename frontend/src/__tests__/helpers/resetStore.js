// Reseta o estado de uma store combine() preservando as ações.
export function resetStore(store, initialStates) {
  const current = store.getState();
  const actions = Object.fromEntries(
    Object.entries(current).filter(([, v]) => typeof v === 'function')
  );
  store.setState({ ...initialStates, ...actions }, true);
}
