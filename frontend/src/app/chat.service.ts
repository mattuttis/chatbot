import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatService {
  /** Sends a message and calls onText with each piece of the reply. */
  async send(message: string, onText: (text: string) => void): Promise<void> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!response.ok || !response.body) {
      throw new Error(`The server answered with status ${response.status}.`);
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      buffer += value;
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      events.forEach((event) => this.handleEvent(event, onText));
    }
  }

  private handleEvent(event: string, onText: (text: string) => void): void {
    const lines = event.split('\n');
    const data = lines.find((line) => line.startsWith('data:'));
    if (!data) {
      return;
    }
    const { text } = JSON.parse(data.slice('data:'.length)) as { text: string };
    if (lines.some((line) => line.startsWith('event:error'))) {
      throw new Error(text);
    }
    onText(text);
  }
}
