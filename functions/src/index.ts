/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import type { DocumentData } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

admin.initializeApp();

export const helloWorld = onRequest(async (request, response) => {
  logger.log("Processing body of rescheduler", request.body);
  if (!request.body.ssn || !request.body.date || !request.body.time) {
    response
      .status(400)
      .send({ message: "Bad request, required: ssn, date, time" });
    return;
  }

  const ssn = request.body.ssn;
  const date = new Date(request.body.date + " " + request.body.time);

  const querySnapshot = await admin
    .firestore()
    .collection("appointments")
    .get();

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

  const appointment = appointments.find((a) => a.guardianSsn === ssn);
  if (!appointment) {
    response.status(404).send({ message: "No appointment found" });
    return;
  }

  await admin.firestore().doc(`appointments/${appointment.uid}`).update({
    datetime: date,
  });

  logger.log("Found appointment", appointment);
  response.status(200).send({ message: "Appointment rescheduled" });
});

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
