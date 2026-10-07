import axe from 'axe-core';

// jsdom has no layout, so contrast is checked in a real browser instead.
// Page-level rules don't apply to a component rendered on its own.
const DISABLED_RULES = ['color-contrast', 'region', 'landmark-one-main', 'page-has-heading-one'];

export async function expectNoAxeViolations(element: Element): Promise<void> {
  const { violations } = await axe.run(element, {
    rules: Object.fromEntries(DISABLED_RULES.map((id) => [id, { enabled: false }])),
  });
  const summary = violations.map(
    (v) => `${v.id}: ${v.help} [${v.nodes.map((n) => n.target.join(' ')).join(', ')}]`,
  );
  expect(summary).toEqual([]);
}
