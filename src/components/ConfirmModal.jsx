import { X, TriangleAlert } from 'lucide-react'

/**
 * Reusable confirmation dialog.
 *
 * <ConfirmModal
 *   open={bool}              // controlled from the parent
 *   title="Delete product?"
 *   message="This can't be undone."
 *   confirmLabel="Yes, delete"
 *   danger                   // red button for destructive actions
 *   busy={bool}              // disables buttons while the action runs
 *   onCancel={() => ...}
 *   onConfirm={() => ...}    // parent closes the modal itself
 * >
 *   <div>…optional extra rows shown above the buttons…</div>
 * </ConfirmModal>
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onCancel,
  onConfirm,
  children,
}) {
  if (!open) return null

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        // clicking the dark backdrop = cancel (not while busy)
        if (e.target === e.currentTarget && !busy) onCancel?.()
      }}
    >
      <div className="modal-card fade-up" role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" aria-label="Close" disabled={busy} onClick={onCancel}>
          <X size={17} />
        </button>

        {danger && (
          <span className="modal-icon modal-icon-danger">
            <TriangleAlert size={22} />
          </span>
        )}

        <h3>{title}</h3>
        {message && <p>{message}</p>}
        {children}

        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
