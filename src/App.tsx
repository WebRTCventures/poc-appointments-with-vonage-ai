import "./App.css";
import {
  DocumentData,
  addDoc,
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";
import { firestoreDb } from "./services/firebaseApp";
import { useEffect, useState } from "react";

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(
    () =>
      listenAppointments((newAppointments) => setAppointments(newAppointments)),
    []
  );

  const today = new Date();
  const todayAppointments = appointments.filter(
    (a) =>
      a.datetime.getFullYear() === today.getFullYear() &&
      a.datetime.getMonth() === today.getMonth() &&
      a.datetime.getDay() === today.getDay()
  );

  return (
    <main>
      <h1>Appointments Schedule</h1>
      {!todayAppointments.length && (
        <p>
          Waiting for appointments data. If this is taking too long, open the
          browser inspector and call the global function:{" "}
          <code>seedTodayAppointments()</code>
        </p>
      )}
      <ul>
        {todayAppointments.map((appointment) => (
          <li key={appointment.uid}>
            <strong>{appointment.datetime.toLocaleString()}</strong>:{" "}
            {appointment.guardianName} ({appointment.studentName})
          </li>
        ))}
      </ul>
    </main>
  );
}

interface Appointment {
  uid: string;
  datetime: Date;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  studentName: string;
  studentGradeLevel: StudentGradeLevel;
}

interface StudentGradeLevel {
  code: string;
  description: string;
}

async function createAppointment(
  appointment: Omit<Appointment, "uid">
): Promise<Appointment> {
  const docRef = await addDoc(
    collection(firestoreDb, "appointments"),
    appointment
  );
  return { uid: docRef.id, ...appointment };
}

function listenAppointments(
  callback: (appointments: Appointment[]) => void
): () => void {
  return onSnapshot(
    query(collection(firestoreDb, "appointments")),
    (querySnapshot) => {
      const appointments: Appointment[] = [];

      querySnapshot.forEach((doc: DocumentData) => {
        const data = doc.data();
        appointments.push({
          uid: doc.id,
          datetime: data.datetime.toDate(),
          guardianName: data.guardianName,
          guardianEmail: data.guardianEmail,
          guardianPhone: data.guardianPhone,
          studentName: data.studentName,
          studentGradeLevel: data.studentGradeLevel,
        } as Appointment);
      });

      callback(appointments);
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).seedTodayAppointments = async () => {
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
      guardianEmail: "john.doe@mail.com",
      guardianPhone: "+1-123-456-7890",
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
      guardianEmail: "jane.doe@mail.com",
      guardianPhone: "+1-234-567-8901",
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
      guardianEmail: "tom.smith@mail.com",
      guardianPhone: "+1-345-678-9012",
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
      guardianEmail: "emily.johnson@mail.com",
      guardianPhone: "+1-456-789-0123",
      studentName: "Allan",
      studentGradeLevel: getRandomGradeLevelOption(),
    },
  ];

  console.log("Adding seed data for appointments:", appointments);

  await Promise.all(appointments.map((a) => createAppointment(a)));
};

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
