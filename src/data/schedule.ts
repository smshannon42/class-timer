export interface ClassPeriod {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  cleanupTime?: string;
}

export const BELL_SCHEDULE: ClassPeriod[] = [
  { id: 'p1', name: '1st Period', startTime: '08:20', endTime: '09:06' },
  { id: 'p2', name: '2nd Period', startTime: '09:09', endTime: '09:55' },
  { id: 'p3', name: '3rd Period (Cardio/Weights)', startTime: '09:58', endTime: '10:44', cleanupTime: '10:37' },
  { id: 'p4', name: '4th Period', startTime: '10:47', endTime: '11:33' },
  { id: 'p5', name: '5th Period', startTime: '12:06', endTime: '13:03' },
  { id: 'p6', name: '6th Period (Cardio/Weights)', startTime: '13:06', endTime: '13:52', cleanupTime: '13:40' },
  { id: 'p7', name: '7th Period (Cardio/Weights)', startTime: '13:55', endTime: '14:41', cleanupTime: '14:30' },
  { id: 'p8', name: '8th Period', startTime: '14:44', endTime: '15:30' },
];
