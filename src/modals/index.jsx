// The open dialog, if any. Which one is open is a saved preference (see useModalControls).
import React, { useEffect, useRef } from 'react';
import { useRoute, href } from '../router.jsx';
import { usePref } from '../state/store.jsx';
import { useModalControls } from '../state/modal.js';
import { SearchModal } from './Search.jsx';
import { MissingModal, IssueModal } from './Reports.jsx';
import { AddressModal } from '../pages/client/address/AddressModal.jsx';

const DIALOGS = { search: SearchModal, missing: MissingModal, issue: IssueModal, address: AddressModal };

export function Modals() {
  const [modal] = usePref('modal', null);
  const { openModal, closeModal } = useModalControls();
  // Going to another page (a link, Back, a typed address) dismisses the open dialog; a reload keeps it.
  const at = href(useRoute());
  const was = useRef(at);
  useEffect(() => { if (was.current !== at) { was.current = at; if (modal) closeModal(); } }, [at]);
  const Dialog = modal && DIALOGS[modal.id];
  return Dialog ? <Dialog key={modal.id} {...modal} onClose={closeModal} openModal={openModal} /> : null;
}
