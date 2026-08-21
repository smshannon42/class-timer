export interface ClassPeriod {
  id: string;
  name: string;
  startTime: string; // "HH:MM" 24h format
  endTime: string;
  cleanupTime?: string;
}

export const BELL_SCHEDULE: ClassPeriod[] = [
  { id: 'p1', name: '1st Period', startTime: '08:25', endTime: '09:12', cleanupTime: '09:07' },
  { id: 'p2', name: '2nd Period', startTime: '09:16', endTime: '10:03', cleanupTime: '09:58' },
  { id: 'p3', name: '3rd Period', startTime: '10:07', endTime: '10:54', cleanupTime: '10:49' },
  { id: 'p4', name: '4th Period', startTime: '10:58', endTime: '11:45', cleanupTime: '11:40' },
  { id: 'p5', name: '5th Period', startTime: '11:49', endTime: '12:36', cleanupTime: '12:31' },
  { id: 'p6', name: '6th Period', startTime: '12:40', endTime: '13:27', cleanupTime: '13:22' },
  { id: 'p7', name: '7th Period', startTime: '13:31', endTime: '14:18', cleanupTime: '14:13' },
  { id: 'p8', name: '8th Period', startTime: '14:22', endTime: '15:35', cleanupTime: '15:30' },
];
