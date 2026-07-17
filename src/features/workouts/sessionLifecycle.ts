export type WorkoutSessionLifecycle = 'idle' | 'starting' | 'active' | 'finishing' | 'completed';

export type WorkoutSessionLifecycleTransition =
  | { type: 'begin-start' }
  | { type: 'activate' }
  | { type: 'begin-finishing' }
  | { type: 'mark-completed' }
  | { type: 'clear' };

export const transitionWorkoutSessionLifecycle = (
  current: WorkoutSessionLifecycle,
  transition: WorkoutSessionLifecycleTransition,
): WorkoutSessionLifecycle => {
  switch (transition.type) {
    case 'begin-start':
      return 'starting';
    case 'activate':
      return 'active';
    case 'begin-finishing':
      return current === 'active' ? 'finishing' : current;
    case 'mark-completed':
      return 'completed';
    case 'clear':
      return 'idle';
    default:
      return current;
  }
};

export const isActiveWorkoutSessionLifecycle = (value: WorkoutSessionLifecycle) => value === 'starting' || value === 'active' || value === 'finishing';
