import { describe, expect, it } from 'vitest';

import {
  parseDeleteSocialWorkoutPostResponse,
  parseSocialWorkoutPostDto,
  parseSocialWorkoutPostPageResponse,
  parseSocialWorkoutPostResponse,
} from './workout-post-parsers';

const profile = {
  schemaVersion: 1,
  username: 'coach_ivan',
  displayName: 'Ivan',
  bio: null,
  avatarUrl: null,
  visibility: 'public',
  createdAt: '2026-07-31T08:00:00.000Z',
  updatedAt: '2026-07-31T08:00:00.000Z',
};

const assetId = '77fe3b62-e922-4f7c-822e-c5cf4a2acf21';
const hash = 'a'.repeat(64);
const variant = (name: string, width: number, height: number) => ({
  width,
  height,
  mimeType: 'image/jpeg',
  contentHash: hash,
  url: `https://media.test.invalid/public/social-media/v1/${assetId}/${name}/${hash}.jpg`,
});
const image = {
  schemaVersion: 1,
  assetId,
  assetType: 'workout_post_image',
  width: 1440,
  height: 1080,
  aspectRatio: 4 / 3,
  placeholder: { type: 'average_color', value: '#123456' },
  variants: {
    post_320: variant('post_320', 320, 240),
    post_640: variant('post_640', 640, 480),
    post_1080: variant('post_1080', 1080, 810),
    post_1440: variant('post_1440', 1440, 1080),
  },
};

const post = {
  schemaVersion: 2,
  id: '4d1792e8-7fe8-4dde-96c9-760f696529a8',
  author: profile,
  caption: 'Solid session',
  workout: {
    schemaVersion: 1,
    title: 'Upper body',
    durationMinutes: 45,
    exercises: [
      {
        name: 'Bench Press',
        sets: [{ reps: 8 }, { weight: 70, reps: 10, rpe: 9 }],
      },
    ],
    totalVolume: 1340,
  },
  image,
  createdAt: '2026-07-31T09:00:00.000Z',
};

describe('social workout post parsers', () => {
  it('parses the strict versioned public post contract', () => {
    expect(parseSocialWorkoutPostResponse({ post })).toEqual(post);
    expect(parseSocialWorkoutPostDto(post).workout.exercises?.[0]?.sets).toEqual([
      { reps: 8 },
      { weight: 70, reps: 10, rpe: 9 },
    ]);
    expect(parseSocialWorkoutPostDto({ ...post, image: null }).image).toBeNull();
  });

  it('fails closed on private source fields and unknown DTO keys', () => {
    expect(() =>
      parseSocialWorkoutPostDto({
        ...post,
        sourceWorkoutSessionId: '4d1792e8-7fe8-4dde-96c9-760f696529a8',
      }),
    ).toThrow('Invalid social workout post response');
    expect(() =>
      parseSocialWorkoutPostDto({
        ...post,
        author: { ...profile, email: 'private@example.com' },
      }),
    ).toThrow('Invalid social profile response');
    expect(() =>
      parseSocialWorkoutPostDto({
        ...post,
        idempotencyKey: 'private-key',
      }),
    ).toThrow('Invalid social workout post response');
  });

  it('rejects malformed or avatar media descriptors', () => {
    expect(() =>
      parseSocialWorkoutPostDto({
        ...post,
        image: { ...image, assetType: 'avatar' },
      }),
    ).toThrow();
    expect(() =>
      parseSocialWorkoutPostDto({
        ...post,
        image: { ...image, privateObjectKey: 'private/original.jpg' },
      }),
    ).toThrow('Invalid managed media descriptor response');
    expect(() =>
      parseSocialWorkoutPostDto({
        ...post,
        image: {
          ...image,
          variants: {
            ...image.variants,
            post_640: {
              ...image.variants.post_640,
              url: 'https://untrusted.example/image.jpg',
            },
          },
        },
      }),
    ).toThrow('Invalid managed media variant response');
  });

  it('rejects malformed snapshot versions and set values', () => {
    expect(() =>
      parseSocialWorkoutPostDto({
        ...post,
        workout: { ...post.workout, schemaVersion: 2 },
      }),
    ).toThrow('Invalid social workout snapshot response');
    expect(() =>
      parseSocialWorkoutPostDto({
        ...post,
        workout: {
          schemaVersion: 1,
          exercises: [{ name: 'Bench Press', sets: [{ rpe: 12 }] }],
        },
      }),
    ).toThrow('Invalid social workout set response');
    expect(() =>
      parseSocialWorkoutPostDto({
        ...post,
        workout: {
          schemaVersion: 1,
          exercises: [{ name: 'Bench Press', sets: [{ reps: 8.5 }] }],
        },
      }),
    ).toThrow('Invalid social workout set response');
  });

  it('parses bounded cursor pages and strict deletion acknowledgements', () => {
    expect(
      parseSocialWorkoutPostPageResponse({ items: [post], nextCursor: 'cursor-1' }),
    ).toEqual({ items: [post], nextCursor: 'cursor-1' });
    expect(parseDeleteSocialWorkoutPostResponse({ success: true })).toBe(true);
    expect(() =>
      parseSocialWorkoutPostPageResponse({
        items: Array.from({ length: 51 }, () => post),
        nextCursor: null,
      }),
    ).toThrow('Invalid social workout post page response');
    expect(() =>
      parseDeleteSocialWorkoutPostResponse({ success: true, id: post.id }),
    ).toThrow('Invalid social workout post deletion response');
  });
});
