export interface Appointment {
  uid: string;
  datetime: Date;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  studentName: string;
  studentGradeLevel: StudentGradeLevel;
}

export interface StudentGradeLevel {
  code: string;
  description: string;
}
