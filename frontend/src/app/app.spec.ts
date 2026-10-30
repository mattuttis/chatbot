import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { App } from './app';
import { ChatService } from './chat.service';

describe('App', () => {
  const send = vi.fn();

  beforeEach(async () => {
    send.mockReset();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: ChatService, useValue: { send } }],
    }).compileComponents();
  });

  async function submit(message: string) {
    const fixture = TestBed.createComponent(App);
    const element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    const input = element.querySelector('input') as HTMLInputElement;
    input.value = message;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    element.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    return element;
  }

  it('shows the message and the streamed reply', async () => {
    send.mockImplementation(async (_message: string, onText: (text: string) => void) => {
      onText('Hello');
      onText(' world');
    });

    const element = await submit('Hi');

    expect(send).toHaveBeenCalledWith('Hi', expect.any(Function));
    const messages = [...element.querySelectorAll('.message')].map((m) => m.textContent?.trim());
    expect(messages).toEqual(['Hi', 'Hello world']);
  });

  it('shows an error when the reply fails', async () => {
    send.mockRejectedValue(new Error('The reply failed. Please try again.'));

    const element = await submit('Hi');

    expect(element.querySelector('.message.failed')?.textContent).toContain('The reply failed');
  });

  it('does not send a blank message', async () => {
    await submit('   ');

    expect(send).not.toHaveBeenCalled();
  });
});
