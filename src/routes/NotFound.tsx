/**
 * Task 2.1 (sdd/phase2-app-shell): catch-all for unknown paths. Wired into
 * PageLayer/turn chrome as of task 2.5 — D8 makes `PageLayer`'s own `<h1>`
 * the focus target and `aria-labelledby` referent, so this heading is
 * demoted to `<h2>` (same level as every other route page's own heading via
 * `Panel`) to avoid a second competing `<h1>` inside the dialog.
 */
export function NotFound() {
  return (
    <section>
      <h2>404</h2>
      <p>Route not found.</p>
    </section>
  );
}
