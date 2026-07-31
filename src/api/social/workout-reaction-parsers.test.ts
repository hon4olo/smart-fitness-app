import { describe, expect, it } from 'vitest';

import {
  parseSocialWorkoutReactionDto,
  parseSocialWorkoutReactionResponse,
} from './workout-reaction-parsers';

const reaction = {
  schemaVersion: 1,
  reacted: true,
  reactionCount: 12,
};

describe('social workout reaction parsers', () => {
  it('parses the strict versioned response', () => {
    expect(parseSocialWorkoutReactionDto(reaction)).toEqual(reaction);
    expect(parseSocialWorkoutReactionResponse({ reaction })).toEqual(reaction);
  });

  it.each([
    null,
    {},
    { ...reaction, schemaVersion: 2 },
    { ...reaction, reacted: 'true' },
    { ...reaction, reactionCount: -1 },
    { ...reaction, reactionCount: 1.5 },
    { ...reaction, reactionCount: Number.MAX_SAFE_INTEGER + 1 },
    { ...reaction, privateUserIds: ['private'] },
  ])('rejects malformed or expanded reaction DTOs', (value) => {
    expect(() => parseSocialWorkoutReactionDto(value)).toThrow(
      'Invalid social workout reaction response',
    );
  });

  it.each([
    reaction,
    {},
    { reaction, extra: true },
    { reaction: { ...reaction, internalPostId: 'private' } },
  ])('rejects malformed response envelopes', (value) => {
    expect(() => parseSocialWorkoutReactionResponse(value)).toThrow(
      'Invalid social workout reaction response',
    );
  });
});
