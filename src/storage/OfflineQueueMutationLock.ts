let mutationChain: Promise<void> = Promise.resolve();

export const withOfflineQueueMutationLock = <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  const result = mutationChain.then(operation, operation);
  mutationChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};