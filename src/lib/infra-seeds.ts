import { Appointment, StudentGradeLevel } from "./domain";
import { createAppointment } from "./infra";

export async function seedTodayAppointments() {
  const now = new Date();

  const appointments: Omit<Appointment, "uid">[] = [
    {
      datetime: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        10,
        0,
        0
      ),
      guardianName: "John Johnson",
      guardianSsn: "123456789",
      guardianEmail: "john.doe@mail.com",
      guardianPhone: "+1 505-415-9991",
      studentName: "Carl",
      studentGradeLevel: getRandomGradeLevelOption(),
    },
    {
      datetime: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        11,
        30,
        0
      ),
      guardianName: "Jane Doe",
      guardianSsn: "987654321",
      guardianEmail: "jane.doe@mail.com",
      guardianPhone: "+1 505-644-6070",
      studentName: "Ken",
      studentGradeLevel: getRandomGradeLevelOption(),
    },
    {
      datetime: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        13,
        0,
        0
      ),
      guardianName: "Tom Smith",
      guardianSsn: "456789123",
      guardianEmail: "tom.smith@mail.com",
      guardianPhone: "+1 202-443-2300",
      studentName: "Barbie",
      studentGradeLevel: getRandomGradeLevelOption(),
    },
    {
      datetime: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        14,
        30,
        0
      ),
      guardianName: "Emily Johnson",
      guardianSsn: "789123456",
      guardianEmail: "emily.johnson@mail.com",
      guardianPhone: "+1 203-974-0128",
      studentName: "Allan",
      studentGradeLevel: getRandomGradeLevelOption(),
    },
  ];

  console.log("Adding seed data for appointments:", appointments);

  await Promise.all(appointments.map((a) => createAppointment(a)));
}

function getRandomGradeLevelOption() {
  const randomIndex = Math.floor(Math.random() * STUDENTS_GRADE_OPTIONS.length);
  return STUDENTS_GRADE_OPTIONS[randomIndex];
}

const STUDENTS_GRADE_OPTIONS: readonly StudentGradeLevel[] = Object.freeze([
  { code: "01", description: "First Grade" },
  { code: "02", description: "Second Grade" },
  { code: "03", description: "Third Grade" },
  { code: "04", description: "Fourth Grade" },
  { code: "05", description: "Fifth Grade" },
  { code: "06", description: "Sixth Grade" },
  { code: "07", description: "Seventh Grade" },
  { code: "08", description: "Eighth Grade" },
  { code: "09", description: "Ninth Grade" },
  { code: "10", description: "Tenth Grade" },
  { code: "11", description: "Eleventh Grade" },
  { code: "12", description: "Twelfth Grade" },
]);
