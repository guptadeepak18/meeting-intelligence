import { Injectable } from '@nestjs/common';

export interface NormalizedUtterance {
  segmentIndex: number;
  speakerLabel?: string;
  startMs: number;
  endMs: number;
  text: string;
  confidence?: number;
}

@Injectable()
export class TranscriptionAdapterService {
  normalizeTranscript(text: string): NormalizedUtterance[] {
    const cleaned = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' ');

    const segments = cleaned
      .split(/(?<=[.!?])\s+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    const utterances: NormalizedUtterance[] = [];
    let cursor = 0;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]!;
      const duration = Math.max(1500, segment.length * 35);
      utterances.push({
        segmentIndex: index,
        speakerLabel: index % 2 === 0 ? 'spk_0' : 'spk_1',
        startMs: cursor,
        endMs: cursor + duration,
        text: segment,
        confidence: 0.9,
      });
      cursor += duration;
    }

    if (utterances.length === 0) {
      utterances.push({
        segmentIndex: 0,
        speakerLabel: 'spk_0',
        startMs: 0,
        endMs: 3000,
        text: cleaned || 'No transcript content available.',
        confidence: 0.4,
      });
    }

    return utterances;
  }
}
