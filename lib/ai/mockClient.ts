import { AIClient } from './aiClient';

export const mockClient: AIClient = {
  async ask(question) {
    return `Mock answer for: ${question}`;
  },
};
