/**
 * The slice of an element that global shortcut handlers inspect. Plain
 * objects satisfy it, so the rule is testable without a DOM.
 */
export interface KeyTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?(name: string): string | null;
  hasAttribute?(name: string): boolean;
  parentElement?: KeyTargetLike | null;
}

const OWNING_TAGS = new Set([
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'BUTTON',
  'A',
  'SUMMARY',
]);

/**
 * True when the keydown target, or one of its ancestors, handles keys itself:
 * form controls, buttons, links, disclosure summaries, role="button",
 * editable content and any `[data-no-global-keys]` container. Window-level
 * shortcuts such as Space for play must ignore those events, or Space on a
 * focused button would both press it and toggle playback.
 */
export function targetOwnsKeys(
  target: KeyTargetLike | null | undefined,
): boolean {
  for (let node = target; node; node = node.parentElement) {
    if (node.isContentEditable) return true;
    if (node.tagName && OWNING_TAGS.has(node.tagName.toUpperCase()))
      return true;
    if (node.getAttribute?.('role') === 'button') return true;
    if (node.hasAttribute?.('data-no-global-keys')) return true;
  }
  return false;
}
