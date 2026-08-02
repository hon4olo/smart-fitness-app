import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/client";

import {
  buildSocialProfileInput,
  createSocialProfileFormValues,
  getSocialProfileRequestError,
  validateSocialProfileForm,
} from "./socialProfileForm";

const profile = {
  schemaVersion: 1 as const,
  username: "coach_ivan",
  displayName: "Ivan",
  bio: null,
  avatarUrl: null,
  visibility: "private" as const,
  createdAt: "2026-07-31T08:00:00.000Z",
  updatedAt: "2026-07-31T08:00:00.000Z",
};

describe("social profile form model", () => {
  it("hydrates server state without mixing it into private AppState", () => {
    expect(createSocialProfileFormValues(profile, "Fallback")).toEqual({
      username: "coach_ivan",
      displayName: "Ivan",
      bio: "",
      visibility: "private",
    });
    expect(
      createSocialProfileFormValues(null, "  Account Name  ").displayName,
    ).toBe("Account Name");
  });

  it("validates bounded public text fields and fails closed", () => {
    expect(
      validateSocialProfileForm({
        username: "bad-name",
        displayName: "",
        bio: "x".repeat(281),
        visibility: "public",
      }),
    ).toEqual({
      username: "format",
      displayName: "required",
      bio: "length",
    });
  });

  it("builds an explicit payload without an arbitrary avatar URL", () => {
    expect(
      buildSocialProfileInput({
        username: "  Coach_Ivan  ",
        displayName: "  Ivan  ",
        bio: "   ",
        visibility: "public",
      }),
    ).toEqual({
      username: "Coach_Ivan",
      displayName: "Ivan",
      bio: null,
      visibility: "public",
    });
  });

  it("maps backend and transport failures to bounded presentation states", () => {
    expect(
      getSocialProfileRequestError(
        new ApiError({
          code: "conflict",
          message: "Conflict",
          status: 409,
          body: { code: "SOCIAL_USERNAME_TAKEN" },
        }),
      ),
    ).toBe("username_taken");
    expect(
      getSocialProfileRequestError(
        new ApiError({ code: "network_error", message: "Offline" }),
      ),
    ).toBe("offline");
    expect(
      getSocialProfileRequestError(
        new ApiError({ code: "unauthorized", message: "Expired", status: 401 }),
      ),
    ).toBe("session_expired");
    expect(getSocialProfileRequestError(new Error("internal detail"))).toBe(
      "generic",
    );
  });
});
