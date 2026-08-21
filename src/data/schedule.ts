export interface Period {
  id: string;
  name: string;
  startTime: string; // HH:mm (24-hour format)
  endTime: string;   // HH:mm (24-hour format)
  cleanupTime?: string; // HH:mm when workout ends / cleanup triggers
}

export const BELL_SCHEDULE: Period[] = [
  {
    id: 'p1',
    name: '1st Period',
    startTime: '08:15',
    endTime: '09:00',
    cleanupTime: '08:50', // Workout ends at 8:50 AM
  },
  {
    id: 'p2',
    name: '2nd Period',
    startTime: '09:05',
    endTime: '09:50',
    cleanupTime: '09:42',
  },
  {
    id: 'p3',
    name: '3rd Period',
    startTime: '09:55',
    endTime: '10:40',
    cleanupTime: '10:35',
  },
  {
    id: 'p4',
    name: '4th Period',
    startTime: '10:45',
    endTime: '11:30',
    cleanupTime: '11:22',
  },
  {
    id: 'p5',
    name: '5th Period / Lunch',
    startTime: '11:35',
    endTime: '13:05',
    cleanupTime: '12:57',
  },
  {
    id: 'p6',
    name: '6th Period',
    startTime: '13:10',
    endTime: '13:55',
    cleanupTime: '13:50',
  },
  {
    id: 'p7',
    name: '7th Period',
    startTime: '14:00',
    endTime: '14:45',
    cleanupTime: '14:40',
  },
  {
    id: 'p8',
    name: '8th Period',
    startTime: '14:50',
    endTime: '15:35',
    cleanupTime: '15:25', // Workout ends at 3:25 PM
  },
];
