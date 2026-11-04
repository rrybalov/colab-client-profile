// Which dialog is open is a saved preference, so a reload puts the person back where they were.
// openModal('address', { clientId: 'c1' }) passes extra details the dialog needs.
import { useApi } from './store.jsx';

export function useModalControls() {
  const { setPref } = useApi();
  return { openModal: (id, params) => setPref('modal', { id, ...(params || {}) }), closeModal: () => setPref('modal', null) };
}
