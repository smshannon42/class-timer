export interface PeriodSchedule {
  id: string;
  name: string;
  startMinutes: number; // minutes from midnight
  endMinutes: number;   // workout end cutoff (minutes from midnight)
  cleanupMinutes?: number;
}

// Target Workout End Times:
// 1st: 8:50 AM (530)
// 3rd: 10:38 AM (638)
// 6th: 1:40 PM / 13:40 (820)
// 7th: 2:29 PM / 14:29 (869)
// 8th: 3:25 PM / 15:25 (925)
export const BELL_SCHEDULE: PeriodSchedule[] = [
  {
    id: '1st',
    name: '1st Period',
    startMinutes: 8 * 60 + 20, // 8:20 AM
    endMinutes: 8 * 60 + 50,   // 8:50 AM (Workout End)
  },
  {
    id: '3rd',
    name: '3rd Period',
    startMinutes: 9 * 60 + 5,  // 9:05 AM
    endMinutes: 10 * 60 + 38,  // 10:38 AM (Workout End)
  },
  {
    id: '6th',
    name: '6th Period',
    startMinutes: 13 * 60 + 0, // 1:00 PM
    endMinutes: 13 * 60 + 40,  // 1:40 PM (Workout End)
  },
  {
    id: '7th',
    name: '7th Period',
    startMinutes: 13 * 60 + 50, // 1:50 PM
    endMinutes: 14 * 60 + 29,  // 2:29 PM (Workout End)
  },
  {
    id: '8th',
    name: '8th Period',
    startMinutes: 14 * 60 + 40, // 2:40 PM
    endMinutes: 15 * 60 + 25,  // 3:25 PM (Workout End)
  },
];
