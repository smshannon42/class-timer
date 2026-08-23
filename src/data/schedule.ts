export interface PeriodSchedule {
  id: string;
  name: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

// Target Workout Windows:
// 1st: 8:20 AM - 8:50 AM
// 3rd: 10:00 AM - 10:38 AM
// 6th: 1:10 PM - 1:40 PM (13:10 - 13:40)
// 7th: 2:00 PM - 2:29 PM (14:00 - 14:29)
// 8th: 2:50 PM - 3:25 PM (14:50 - 15:25)
export const BELL_SCHEDULE: PeriodSchedule[] = [
  {
    id: '1st',
    name: '1st Period',
    startHour: 8,
    startMinute: 20,
    endHour: 8,
    endMinute: 50,
  },
  {
    id: '3rd',
    name: '3rd Period',
    startHour: 10,
    startMinute: 0,
    endHour: 10,
    endMinute: 38,
  },
  {
    id: '6th',
    name: '6th Period',
    startHour: 13,
    startMinute: 10,
    endHour: 13,
    endMinute: 40,
  },
  {
    id: '7th',
    name: '7th Period',
    startHour: 14,
    startMinute: 0,
    endHour: 14,
    endMinute: 29,
  },
  {
    id: '8th',
    name: '8th Period',
    startHour: 14,
    startMinute: 50,
    endHour: 15,
    endMinute: 25,
  },
];
