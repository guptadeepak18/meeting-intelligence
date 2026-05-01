import { Injectable } from '@nestjs/common';
import { ACTION_EXTRACTION_SYSTEM_PROMPT, extractionOutputSchema, type ExtractionOutput } from '@meeting-intelligence/shared';

interface ExtractionContext {
  transcriptText: string;
  model: string;
}

@Injectable()
export class ExtractionEngineService {
  async extract(context: ExtractionContext): Promise<ExtractionOutput> {
    const apiKey = process.env.HF_API_KEY;

    if (apiKey) {
      const remote = await this.tryManagedInference(context, apiKey);
      if (remote) {
        return remote;
      }
    }

    return this.fallbackExtraction(context.transcriptText);
  }

  private async tryManagedInference(
    context: ExtractionContext,
    apiKey: string,
  ): Promise<ExtractionOutput | null> {
    try {
      const endpoint = `https://api-inference.huggingface.co/models/${encodeURIComponent(context.model)}`;
      const prompt = `${ACTION_EXTRACTION_SYSTEM_PROMPT}\n\nTranscript:\n${context.transcriptText}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 800,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        return null;
      }

      const body = await response.json();
      const first = Array.isArray(body) ? body[0] : body;
      const text = typeof first?.generated_text === 'string' ? first.generated_text : '';
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1) {
        return null;
      }

      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      const validated = extractionOutputSchema.safeParse(parsed);
      return validated.success ? validated.data : null;
    } catch {
      return null;
    }
  }

  private fallbackExtraction(transcriptText: string): ExtractionOutput {
    type ActionItem = ExtractionOutput['actionItems'][number];
    const sentences = transcriptText
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const candidates: ActionItem[] = sentences
      .filter((line) => /(will|need to|must|follow up|by\s+\w+)/i.test(line))
      .slice(0, 8)
      .map((line) => {
        const ownerMatch = line.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
        const dueMatch = line.match(/by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next\s+week)/i);

        return {
          title: line.replace(/\.$/, ''),
          ownerCandidate: ownerMatch?.[1] ?? null,
          dueDate: dueMatch ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null,
          priority: /(urgent|asap|critical|blocker)/i.test(line) ? 'high' : 'medium',
          confidence: ownerMatch ? 0.82 : 0.64,
          rationale: 'Derived from action-oriented sentence in transcript.',
        };
      });

    if (candidates.length === 0) {
      candidates.push({
        title: 'Review meeting transcript and capture manual action items',
        ownerCandidate: null,
        dueDate: null,
        priority: 'low',
        confidence: 0.4,
        rationale: 'No explicit commitments were detected by heuristic extraction.',
      });
    }

    return extractionOutputSchema.parse({ actionItems: candidates });
  }
}
