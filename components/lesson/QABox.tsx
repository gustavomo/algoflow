'use client';
import { useState } from 'react';

export default function QABox({ tech }: { tech?: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, tech }),
      });
      const json = await res.json();
      setAnswer(json.answer ?? '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        className="w-full border p-2"
        placeholder="Ask the AI"
      />
      <button onClick={ask} disabled={loading} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60">
        {loading ? 'Asking…' : 'Ask'}
      </button>
      {answer && <p className="mt-2 p-2 border rounded">{answer}</p>}
    </div>
  );
}

