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
  const date = makeDatetime({
    date: request.body.date,
    time: request.body.time,
  });

  // Example of bot output:
  // We don't have availability for this given time. Alternatives are ...

  // Check: within working hours
  if (date.getUTCHours() < OPENING_HOUR || date.getUTCHours() >= CLOSING_HOUR) {
    response.status(200).send({
      alternativeTimesText: `after ${OPENING_HOUR_TEXT} and before ${CLOSING_HOUR_TEXT}`,
    });
    return;
  }

  // Check: within time slots
  if (date.getUTCMinutes() % MEETING_DURATION_IN_MINUTES !== 0) {
    const options = getOptionsAtSuchHour(date);
    response
      .status(200)
      .send({ alternativeTimesText: getReadableTimesText(options) });
    return;
  }

  // TODO: Check: free slot

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
const OPENING_HOUR_TEXT = "9 AM";

const CLOSING_HOUR = 18;
const CLOSING_HOUR_TEXT = "6 PM";

const makeDatetime = ({ date, time }: { date: string; time: string }): Date => {
  const dateInstance = new Date(date + " " + time + " +0");
  dateInstance.setUTCMilliseconds(0);
  return dateInstance;
};

const APPOINTMENTS_PER_HOUR = 4;

const MEETING_DURATION_IN_MINUTES = 60 / APPOINTMENTS_PER_HOUR;

const getOptionsAtSuchHour = (date: Date): Date[] => {
  const dateRoundedAt00 = new Date(date);
  dateRoundedAt00.setUTCMinutes(0);
  const options = new Array(APPOINTMENTS_PER_HOUR)
    .fill(null)
    .map((_, index) => {
      const option = new Date(date);
      option.setUTCMinutes(MEETING_DURATION_IN_MINUTES * index);
      return option;
    });
  return options;
};

const getReadableTime = (d: Date): string =>
  d.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

const getReadableTimes = (ds: Date[]): string[] =>
  ds.map((d) => getReadableTime(d));

const getReadableTimesText = (datetimes: Date[]): string => {
  const texts = getReadableTimes(datetimes);
  const firsts = texts.slice(0, texts.length - 1);
  const last = texts.at(texts.length - 1);
  return firsts.join(", ") + " or " + last;
};
