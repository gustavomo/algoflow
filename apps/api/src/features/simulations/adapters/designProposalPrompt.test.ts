import { describe, expect, it } from 'vitest';
import { parseDesignProposalOutput } from './designProposalPrompt';

describe('design proposal provider output', () => {
  it('accepts the canonical op field', () => {
    expect(
      parseDesignProposalOutput(
        JSON.stringify({
          rationale: 'Add the missing edge.',
          operations: [
            {
              op: 'add-edge',
              edge: { id: 'suggested-edge', from: 'a', to: 'b' },
            },
          ],
        }),
      ).operations[0],
    ).toMatchObject({ op: 'add-edge' });
  });

  it('normalizes only the common operation field alias for validation', () => {
    expect(
      parseDesignProposalOutput(
        JSON.stringify({
          rationale: 'Add the missing block.',
          operations: [
            {
              operation: 'add-node',
              node: { id: 'suggested-cache', type: 'cache' },
            },
          ],
        }),
      ).operations[0],
    ).toMatchObject({ op: 'add-node' });
  });

  it('rejects a malformed outer contract', () => {
    expect(() =>
      parseDesignProposalOutput('{"rationale":false,"operations":{}}'),
    ).toThrow('invalid proposal contract');
  });
});
