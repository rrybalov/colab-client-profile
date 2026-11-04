// The open dialog, if any. Which one is open is a saved preference (see useModalControls).
import React from 'react';
import { usePref } from '../state/store.jsx';
import { useModalControls } from '../state/modal.js';
import { SearchModal } from './Search.jsx';
import { MissingModal, IssueModal } from './Reports.jsx';

const DIALOGS = { search: SearchModal, missing: MissingModal, issue: IssueModal };

export function Modals() {
  const [modal] = usePref('modal', null);
  const { openModal, closeModal } = useModalControls();
  const Dialog = modal && DIALOGS[modal.id];
  return Dialog ? <Dialog key={modal.id} onClose={closeModal} openModal={openModal} /> : null;
}
