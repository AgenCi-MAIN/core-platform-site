import { BOOK_POLICY_STATUSES, POLICY_STATUS_LABELS, type BookCustomer, type BookPolicy } from "./data";

/**
 * The Book's entry forms (owner direction 2026-09-02). Plain HTML forms,
 * server-rendered, no client JS: each posts to its route under
 * /portal/book, which decides ownership on the server and lands back on the
 * Book with a 303. The patterns here are the FIRST line only — the routes
 * re-validate every field and the 0014 CHECK constraints stand behind them.
 */

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY",
  "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

export function CustomerForm() {
  return (
    <form className="portal-book-form" method="post" action="/portal/book/customers">
      <div className="portal-book-form-grid">
        <label className="portal-book-field portal-book-field-wide">
          <span>Customer name</span>
          <input name="display_name" required maxLength={80} autoComplete="off" placeholder="Full name as you know them" />
        </label>
        <label className="portal-book-field">
          <span>Phone</span>
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            pattern="[0-9()+.\-\s]{10,20}"
            placeholder="(555) 555-0123"
          />
          <small>Stored masked — CORE keeps the last four digits only.</small>
        </label>
        <label className="portal-book-field">
          <span>State</span>
          <select name="state" defaultValue="">
            <option value="">—</option>
            {STATES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className="portal-book-field portal-book-field-wide">
          <span>Note</span>
          <textarea name="note" maxLength={500} rows={2} placeholder="Anything the next call should know. 500 characters." />
        </label>
      </div>
      <div className="portal-book-form-actions">
        <button className="portal-button portal-button-primary" type="submit">
          Add customer
        </button>
        <small>Goes into your own book only. Nothing leaves CORE.</small>
      </div>
    </form>
  );
}

export function PolicyForm({
  customers,
  customerId,
}: {
  customers: readonly BookCustomer[];
  /** When set, the form belongs to one customer and carries the id hidden. */
  customerId?: number;
}) {
  return (
    <form className="portal-book-form" method="post" action="/portal/book/policies">
      <input type="hidden" name="intent" value="add" />
      <div className="portal-book-form-grid">
        {customerId !== undefined ? (
          <input type="hidden" name="customer_id" value={customerId} />
        ) : (
          <label className="portal-book-field portal-book-field-wide">
            <span>Customer</span>
            <select name="customer_id" required defaultValue="">
              <option value="" disabled>
                Choose a customer in your book
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.displayName}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="portal-book-field">
          <span>Carrier</span>
          <input name="carrier" required maxLength={60} autoComplete="off" placeholder="e.g. Aetna" />
        </label>
        <label className="portal-book-field">
          <span>Product</span>
          <input name="product" required maxLength={60} autoComplete="off" placeholder="e.g. Final expense" />
        </label>
        <label className="portal-book-field">
          <span>Policy number</span>
          <input name="policy_number" maxLength={40} autoComplete="off" placeholder="Optional" />
          <small>Only the last four characters are kept.</small>
        </label>
        <label className="portal-book-field">
          <span>Status</span>
          <select name="status" defaultValue="applied">
            {BOOK_POLICY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {POLICY_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="portal-book-field">
          <span>Monthly premium ($)</span>
          <input name="premium" inputMode="decimal" pattern="\d{1,6}(\.\d{1,2})?" placeholder="0.00" />
        </label>
        <label className="portal-book-field">
          <span>Effective date</span>
          <input name="effective_on" type="date" />
        </label>
        <label className="portal-book-field portal-book-field-wide">
          <span>Next action</span>
          <input name="next_action" maxLength={120} autoComplete="off" placeholder="e.g. Med records due" />
        </label>
        <label className="portal-book-field">
          <span>Next action due</span>
          <input name="next_action_on" type="date" />
        </label>
      </div>
      <div className="portal-book-form-actions">
        <button className="portal-button portal-button-primary" type="submit">
          Add policy
        </button>
      </div>
    </form>
  );
}

export function StatusForm({ policy, customerId }: { policy: BookPolicy; customerId: number }) {
  return (
    <form className="portal-book-status" method="post" action="/portal/book/policies" aria-label={`Change status of policy ${policy.policyLast4 ?? policy.id}`}>
      <input type="hidden" name="intent" value="status" />
      <input type="hidden" name="policy_id" value={policy.id} />
      <input type="hidden" name="customer_id" value={customerId} />
      <select name="status" defaultValue={policy.status} aria-label="Status">
        {BOOK_POLICY_STATUSES.map((status) => (
          <option key={status} value={status}>
            {POLICY_STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      <button className="portal-button portal-button-quiet" type="submit">
        Save
      </button>
    </form>
  );
}
