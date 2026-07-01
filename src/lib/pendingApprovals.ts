/**
 * Tiny pub/sub so the sidebar's "pending approvals" badge can refresh in
 * real time when an offer is approved/denied elsewhere (the Offer Approvals
 * page). Decoupled - no shared context/provider needed: the page notifies,
 * the sidebar re-fetches its count.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to change notifications. Returns an unsubscribe function. */
export function subscribePendingApprovals(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Notify all subscribers that the pending-approvals count may have changed. */
export function notifyPendingApprovalsChanged(): void {
  listeners.forEach((l) => l());
}
