import { Component, inject, signal } from '@angular/core';
import { ChatService } from './chat.service';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  failed?: boolean;
}

@Component({
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly chat = inject(ChatService);

  protected readonly messages = signal<Message[]>([]);
  protected readonly draft = signal('');
  protected readonly sending = signal(false);

  protected async send(event: Event): Promise<void> {
    event.preventDefault();
    const message = this.draft().trim();
    if (!message || this.sending()) {
      return;
    }

    this.draft.set('');
    this.sending.set(true);
    this.messages.update((messages) => [
      ...messages,
      { role: 'user', text: message },
      { role: 'assistant', text: '' },
    ]);

    try {
      await this.chat.send(message, (text) => this.updateReply((reply) => ({ ...reply, text: reply.text + text })));
    } catch (error) {
      const text = error instanceof Error ? error.message : 'The reply failed. Please try again.';
      this.updateReply((reply) => ({ ...reply, text, failed: true }));
    } finally {
      this.sending.set(false);
    }
  }

  private updateReply(change: (reply: Message) => Message): void {
    this.messages.update((messages) => [...messages.slice(0, -1), change(messages[messages.length - 1])]);
  }
}
