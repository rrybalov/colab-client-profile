// Which dialog is open is a saved preference, so a reload puts the person back where they were.
import { useApi } from './store.jsx';

export function useModalControls() {
  const { setPref } = useApi();
  return { openModal: (id) => setPref('modal', { id }), closeModal: () => setPref('modal', null) };
}
