'use client';
import { StateFrom, EventFrom } from 'xstate';
import playbackMachine from '../../lib/xstate/playbackMachine';

interface Props {
  state: StateFrom<typeof playbackMachine>;
  send: (event: EventFrom<typeof playbackMachine>) => void;
}

export default function PlaybackBar({ state, send }: Props) {
  return (
    <div className="flex gap-2 mt-4">
      <button onClick={() => send({ type: 'PREV' } as any)} className="px-2 py-1 border">Prev</button>
      {state.matches('playing') ? (
        <button onClick={() => send({ type: 'PAUSE' } as any)} className="px-2 py-1 border">Pause</button>
      ) : (
        <button onClick={() => send({ type: 'PLAY' } as any)} className="px-2 py-1 border">Play</button>
      )}
      <button onClick={() => send({ type: 'NEXT' } as any)} className="px-2 py-1 border">Next</button>
    </div>
  );
}
