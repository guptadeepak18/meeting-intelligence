import { describe, expect, it } from 'vitest';
import { ExtractionEngineService } from '../extraction-engine.service';

describe('ExtractionEngineService', () => {
  const engine = new ExtractionEngineService();

  it('extracts action-oriented items from transcript text', async () => {
    const output = await engine.extract({
      transcriptText:
        'Jordan will send release notes by Friday. Avery must review rollback steps before launch.',
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
    });

    expect(output.actionItems.length).toBeGreaterThan(0);
    expect(output.actionItems[0]?.title.toLowerCase()).toContain('release notes');
  });

  it('creates fallback manual review task when no commitments are found', async () => {
    const output = await engine.extract({
      transcriptText: 'General discussion without commitments.',
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
    });

    expect(output.actionItems.length).toBe(1);
    expect(output.actionItems[0]?.title.toLowerCase()).toContain('manual action items');
  });
});
