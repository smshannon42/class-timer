export interface Period {
  id: string;
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  cleanupHour: number;
  cleanupMinute: number;
}

export const BELL_SCHEDULE: Period[] = [
  {
    id: 'p1',
    name: '1st Period',
    startHour: 8,
    startMinute: 20,
    endHour: 9,
    endMinute: 0,
    cleanupHour: 8,
    cleanupMinute: 52,
  },
  {
    id: 'p3',
    name: '3rd Period',
    startHour: 9,
    startMinute: 5,
    endHour: 9,
    endMinute: 45,
    cleanupHour: 9,
    cleanupMinute: 38,
  },
  {
    id: 'p6',
    name: '6th Period',
    startHour: 13,
    startMinute: 0,
    endHour: 13,
    endMinute: 45,
    cleanupHour: 13,
    cleanupMinute: 38,
  },
  {
    id: 'p7',
    name: '7th Period',
    startHour: 13,
    startMinute: 50,
    endHour: 14,
    endMinute: 35,
    cleanupHour: 14,
    cleanupMinute: 28,
  },
  {
    id: 'p8',
    name: '8th Period',
    startHour: 14,
    startMinute: 40,
    endHour: 15,
    endMinute: 30,
    cleanupHour: 15,
    cleanupMinute: 25,
  },
];
