import "./App.css";
import {
  DocumentData,
  addDoc,
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";
import { firestoreDb } from "./services/firebaseApp";
import { useEffect, useMemo, useRef, useState } from "react";

export default function App() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(
    () =>
      listenAppointments((newAppointments) => setAppointments(newAppointments)),
    []
  );

  const sortedAppointments = useMemo(
    () =>
      appointments.sort((left, right) =>
        left.datetime.valueOf() > right.datetime.valueOf() ? 1 : -1
      ),
    [appointments]
  );

  const [recentlyChangeds, setRecentlyChangeds] = useState<string[]>([]);
  const previousAppointmentsRef = useRef<Appointment[]>([]);
  useEffect(() => {
    let changedUids: string[] = [];
    let shiftings = previousAppointmentsRef.current;
    sortedAppointments.forEach((now, nowIndex) => {
      const previousIndex = shiftings.findIndex(
        (shifting) => shifting.uid === now.uid
      );

      const isPositionChange = previousIndex !== nowIndex;
      const isOnlyDataChange =
        !isPositionChange &&
        JSON.stringify(shiftings[previousIndex]) !== JSON.stringify(now);
      if (isPositionChange || isOnlyDataChange) {
        changedUids = [...changedUids, now.uid];
      }

      shiftings = moveElement(shiftings, previousIndex, nowIndex);
    });

    setRecentlyChangeds((previouslyChangeds) => [
      ...previouslyChangeds,
      ...changedUids,
    ]);

    setTimeout(
      () =>
        setRecentlyChangeds((previouslyChangeds) =>
          previouslyChangeds.filter((c) => !changedUids.includes(c))
        ),
      500
    );

    previousAppointmentsRef.current = sortedAppointments;
  }, [sortedAppointments]);

  return (
    <main className="main">
      <header className="main-header">
        <h1 className="main-header__title">School Appointments</h1>
      </header>
      {!sortedAppointments.length && (
        <p>
          <small>
            Waiting for appointments data... If this is taking too long, open
            the browser inspector and call the global function:{" "}
            <code>seedTodayAppointments()</code>
          </small>
        </p>
      )}
      <ul className="appointments-list">
        {sortedAppointments.map((appointment) => (
          <li key={appointment.uid} className="appointments-list-item">
            <details className="appointment">
              <summary
                className={`appointment__summary ${
                  recentlyChangeds.includes(appointment.uid)
                    ? "appointment__summary--updated"
                    : ""
                }`}
              >
                <span className="appointment__summary-time">
                  {appointment.datetime.toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  })}
                </span>
                <span className="appointment__summary-date">
                  {appointment.datetime.toLocaleString("en-US", {
                    month: "short",
                    day: "2-digit",
                    timeZone: "UTC",
                  })}
                </span>
                <span className="appointment__summary-names">
                  {appointment.guardianName} ({appointment.studentName})
                </span>
              </summary>
              <ul className="appointment__content">
                <li>Appointment UID: {appointment.uid}</li>
                <li>
                  Datime:{" "}
                  {appointment.datetime.toLocaleString("en-US", {
                    timeZone: "UTC",
                  })}
                </li>
                <li>Guardian: {appointment.guardianName}</li>
                <li>Security Social Number (SSN): {appointment.guardianSsn}</li>
                <li>Email: {appointment.guardianEmail}</li>
                <li>Phone: {appointment.guardianPhone}</li>
                <li>Student: {appointment.studentName}</li>
                <li>
                  Grade level: {appointment.studentGradeLevel.description}
                </li>
              </ul>
            </details>
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
  guardianSsn: string;
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
          guardianSsn: data.guardianSsn,
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

function moveElement<T>(collection: T[], orig: number, dest: number): T[] {
  if (!collection.length) {
    return [];
  }

  const element = collection[orig];

  if (dest < 0) {
    return [element, ...collection];
  }

  if (dest >= collection.length) {
    return [...collection, element];
  }

  const filtered = collection.filter((_v, i) => i !== orig);
  const before = filtered.slice(0, dest);
  const after = filtered.slice(dest, collection.length);
  return [...before, element, ...after];
}
