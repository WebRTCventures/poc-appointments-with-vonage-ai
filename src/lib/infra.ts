import {
  DocumentData,
  addDoc,
  collection,
  onSnapshot,
  query,
} from "firebase/firestore";
import { firestoreDb } from "../services/firebaseApp";
import { Appointment } from "./domain";

export async function createAppointment(
  appointment: Omit<Appointment, "uid">
): Promise<Appointment> {
  const docRef = await addDoc(
    collection(firestoreDb, "appointments"),
    appointment
  );
  return { uid: docRef.id, ...appointment };
}

export function listenAppointments(
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
