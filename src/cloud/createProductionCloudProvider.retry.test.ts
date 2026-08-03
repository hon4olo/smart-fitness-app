import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/client";

import { withServerRetry } from "./createProductionCloudProvider";

const serverError = () =>
  new ApiError({ code: "unavailable", message: "server failed", status: 503 });

describe("production cloud provider server retry", () => {
  it("waits once before retrying a retryable 5xx failure", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(serverError())
      .mockResolvedValueOnce("ok");
    const delays: number[] = [];

    await expect(
      withServerRetry(
        operation,
        2,
        async (delayMs) => {
          delays.push(delayMs);
        },
        () => 0.5,
      ),
    ).resolves.toBe("ok");

    expect(operation).toHaveBeenCalledTimes(2);
    expect(delays).toEqual([250]);
  });

  it("does not wait or retry a non-5xx failure", async () => {
    const error = new ApiError({
      code: "unauthorized",
      message: "no",
      status: 401,
    });
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(error);
    const wait = vi
      .fn<(delayMs: number) => Promise<void>>()
      .mockResolvedValue(undefined);

    await expect(withServerRetry(operation, 2, wait)).rejects.toBe(error);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });

  it("keeps the retry count bounded when the server remains unavailable", async () => {
    const error = serverError();
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(error);
    const delays: number[] = [];

    await expect(
      withServerRetry(operation, 2, async (delayMs) => {
        delays.push(delayMs);
      }),
    ).rejects.toBe(error);

    expect(operation).toHaveBeenCalledTimes(2);
    expect(delays).toHaveLength(1);
    expect(delays[0]).toBeGreaterThanOrEqual(200);
    expect(delays[0]).toBeLessThanOrEqual(300);
  });
});
