import { describe, expect, it } from 'vitest';
import { type KeyTargetLike, targetOwnsKeys } from '../keyboardTarget';

function el(
  tagName: string,
  attributes: Record<string, string> = {},
  parentElement: KeyTargetLike | null = null,
  isContentEditable = false,
): KeyTargetLike {
  return {
    tagName,
    isContentEditable,
    getAttribute: (name) => attributes[name] ?? null,
    hasAttribute: (name) => name in attributes,
    parentElement,
  };
}

describe('targetOwnsKeys', () => {
  it('leaves plain content to the global shortcuts', () => {
    expect(targetOwnsKeys(null)).toBe(false);
    expect(targetOwnsKeys(el('DIV', {}, el('BODY')))).toBe(false);
  });

  it.each(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A', 'SUMMARY', 'button'])(
    'lets a focused %s keep its keys',
    (tag) => {
      expect(targetOwnsKeys(el(tag))).toBe(true);
    },
  );

  it('respects role="button" and editable content', () => {
    expect(targetOwnsKeys(el('DIV', { role: 'button' }))).toBe(true);
    expect(targetOwnsKeys(el('DIV', {}, null, true))).toBe(true);
  });

  it('looks through ancestors, including opt-out containers', () => {
    expect(targetOwnsKeys(el('svg', {}, el('BUTTON')))).toBe(true);
    expect(
      targetOwnsKeys(
        el('DIV', {}, el('SECTION', { 'data-no-global-keys': '' })),
      ),
    ).toBe(true);
  });
});
