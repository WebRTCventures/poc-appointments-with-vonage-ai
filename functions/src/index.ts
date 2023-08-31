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
  if (!request.body.phone || !request.body.date || !request.body.time) {
    response
      .status(400)
      .send({ message: "Bad request, required: phone, date, time" });
    return;
  }

  // Example of bot input: +55 84 91111-1111
  const phone = request.body.phone.replace(/\D/gm, "");
  if (phone.length < 9) {
    response.status(400).send({ message: "Bad request: phone digits" });
  }

  // Examples of bot input:
  // Date: 2023-09-01
  // Time: 05:00:00
  const date = new Date(request.body.date + " " + request.body.time + " +0");

  // Example of bot output:
  // We don't have availability for this given time. Alternatives are ...
  if (date.getUTCHours() < OPENING_HOUR) {
    response
      .status(200)
      .send({ alternativeTimesText: FIRST_HOURS_TEXTS.join(" or ") });
    return;
  }

  if (date.getUTCHours() >= CLOSING_HOUR) {
    response
      .status(200)
      .send({ alternativeTimesText: `before ${CLOSING_HOUR_TEXT}` });
    return;
  }

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

  const appointment = appointments.find((a) =>
    a.guardianPhone.replace(/\D/gm, "").endsWith(phone)
  );
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

const OPENING_HOUR = 9;
const FIRST_HOURS_TEXTS = Object.freeze(["9 AM", "10 AM"]);

const CLOSING_HOUR = 18;
const CLOSING_HOUR_TEXT = "6 PM";
