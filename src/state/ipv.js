// IPV hooks: the referral list, one referral, and moving referrals between statuses.
import { useCallback } from 'react';
import { useApi, useData, useQuery } from './store.jsx';

export const IPV_STATUS = { intake: 'Intake', review: 'For Review', reviewed: 'Reviewed' };

export function useReferrals() {
  const { source } = useApi();
  const query = useQuery('ipv-referrals', () => source.listReferrals().then((data) => ({ data })));
  return { query, referrals: query.data || [] };
}

export function useReferral(id) {
  const { source } = useApi();
  const query = useQuery(id ? 'ipv-referral:' + id : null, () => source.getReferral(id).then((data) => ({ data })));
  return { query, referral: query.data || null };
}

// Puts changed referrals into the loaded list and detail views, so every screen agrees straight away.
function usePatch() {
  const { dispatch } = useApi();
  const { queries } = useData();
  return useCallback((changed) => {
    const list = queries['ipv-referrals'];
    if (list && Array.isArray(list.data)) {
      const by = {}; changed.forEach((r) => { by[r.id] = r; });
      dispatch({ type: 'query/done', key: 'ipv-referrals', data: list.data.map((r) => by[r.id] || r) });
    }
    changed.forEach((r) => { if (queries['ipv-referral:' + r.id]) dispatch({ type: 'query/done', key: 'ipv-referral:' + r.id, data: r }); });
  }, [dispatch, queries]);
}

export function useIpvMutations() {
  const { source, toast } = useApi();
  const patch = usePatch();
  const fail = useCallback((e) => { toast((e && e.message ? e.message + ' ' : '') + 'Nothing was changed.', { error: true }); throw e; }, [toast]);
  // Moves one or more referrals; the toast offers Undo, which puts each back where it was.
  const move = useCallback((list, status) => {
    const from = list.map((r) => [r.id, r.status]);
    const call = list.length === 1 ? source.setReferralStatus(list[0].id, status).then((r) => [r]) : source.setReferralsStatus(list.map((r) => r.id), status);
    return call.then((changed) => {
      patch(changed);
      const who = list.length === 1 ? (list[0].client ? list[0].client.first + ' ' + list[0].client.last : 'Referral') : list.length + ' referrals';
      toast(who + (status === 'reviewed' ? ' marked Reviewed' : ' moved to ' + IPV_STATUS[status]), {
        undo: () => Promise.all(from.map(([id, s]) => source.setReferralStatus(id, s))).then(patch)
      });
      return changed;
    }, fail);
  }, [source, patch, toast, fail]);
  return { move };
}
