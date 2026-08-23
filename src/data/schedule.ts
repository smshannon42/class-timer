export interface PeriodSchedule {
  id: string;
  name: string;
  startMinutes: number; // minutes from midnight
  endMinutes: number;   // workout end cutoff (minutes from midnight)
}

// Workout Windows:
// 1st: 8:20 AM - 8:50 AM
// 3rd: 10:00 AM - 10:38 AM
// 6th: 1:10 PM - 1:40 PM (13:10 - 13:40)
// 7th: 2:00 PM - 2:29 PM (14:00 - 14:29)
// 8th: 2:50 PM - 3:25 PM (14:50 - 15:25)
export const BELL_SCHEDULE: PeriodSchedule[] = [
  {
    id: '1st',
    name: '1st Period',
    startMinutes: 8 * 60 + 20, // 8:20 AM
    endMinutes: 8 * 60 + 50,   // 8:50 AM
  },
  {
    id: '3rd',
    name: '3rd Period',
    startMinutes: 10 * 60 + 0, // 10:00 AM
    endMinutes: 10 * 60 + 38,  // 10:38 AM
  },
  {
    id: '6th',
    name: '6th Period',
    startMinutes: 13 * 60 + 10, // 1:10 PM
    endMinutes: 13 * 60 + 40,   // 1:40 PM
  },
  {
    id: '7th',
    name: '7th Period',
    startMinutes: 14 * 60 + 0,  // 2:00 PM
    endMinutes: 14 * 60 + 29,   // 2:29 PM
  },
  {
    id: '8th',
    name: '8th Period',
    startMinutes: 14 * 60 + 50, // 2:50 PM
    endMinutes: 15 * 60 + 25,   // 3:25 PM
  },
];
