import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations } from '../../testing/axe';
import { AnswerBubbles } from './answer-bubbles';

function setup(options: readonly number[]) {
  const fixture = TestBed.createComponent(AnswerBubbles);
  fixture.componentRef.setInput('options', options);
  fixture.detectChanges();
  const buttons = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
  return { fixture, buttons };
}

describe('AnswerBubbles', () => {
  it('renders one button per option', () => {
    const { buttons } = setup([54, 56, 63]);
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['54', '56', '63']);
  });

  it('emits the picked value', () => {
    const { fixture, buttons } = setup([54, 56, 63]);
    const picked: number[] = [];
    fixture.componentInstance.picked.subscribe((v) => picked.push(v));
    buttons[1].click();
    expect(picked).toEqual([56]);
  });

  it('can focus the first bubble', () => {
    const { fixture, buttons } = setup([54, 56, 63]);
    fixture.componentInstance.focusFirst();
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('has no accessibility violations', async () => {
    const { fixture } = setup([54, 56, 63]);
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
