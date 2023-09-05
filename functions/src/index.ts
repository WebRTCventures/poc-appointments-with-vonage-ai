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
  if (!isWithinWorkingHours(date)) {
    response.status(200).send({
      alternativeTimesText: `after ${OPENING_HOUR_TEXT} and before ${CLOSING_HOUR_TEXT}`,
    });
    return;
  }

  // Check: within time slots
  if (!isValidTimeSlot(date)) {
    const options = getTimeSlots(date);
    response
      .status(200)
      .send({ alternativeTimesText: getReadableTimesText(options) });
    return;
  }

  // Query appointments

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

  // Check: non-conflicting slot

  const occupiedSlots: Date[] = appointments.map((appointment) => {
    appointment.datetime.setUTCMilliseconds(0);
    return appointment.datetime;
  });
  const isSomeOccupiedSlot = occupiedSlots.some(
    (s) => s.valueOf() === date.valueOf()
  );
  if (isSomeOccupiedSlot) {
    const occupiedSlotsValues: number[] = occupiedSlots.map((s) => s.valueOf());

    const allHourPotentialOptions = getTimeSlots(date);

    const previousHour = new Date(date);
    previousHour.setUTCHours(date.getUTCHours() - 1);
    const allPreviousHourPotentialOptions = getTimeSlots(previousHour);

    const nextHour = new Date(date);
    nextHour.setUTCHours(date.getUTCHours() + 1);
    const allNextHourPotentialOptions = getTimeSlots(nextHour);

    const allBestPotentialOptions = [
      ...allHourPotentialOptions,
      ...allPreviousHourPotentialOptions,
      ...allNextHourPotentialOptions,
    ];
    const allBestOptions = allBestPotentialOptions.filter(
      (o) => !occupiedSlotsValues.includes(o.valueOf())
    );
    if (allBestOptions.length) {
      const bestOptions = allBestOptions.slice(0, 3);
      response
        .status(200)
        .send({ alternativeTimesText: getReadableTimesText(bestOptions) });
      return;
    }

    const allDayOptions: Date[] = new Array(CLOSING_HOUR - OPENING_HOUR)
      .fill(null)
      .reduce((acc, _, index) => {
        const atPotentialHour = new Date(date);
        atPotentialHour.setUTCHours(OPENING_HOUR * index);
        const potentialOptions = getTimeSlots(atPotentialHour);
        const freeOptions = potentialOptions.filter(
          (o) => !occupiedSlotsValues.includes(o.valueOf())
        );
        return [...acc, ...freeOptions];
      }, []);
    const dayOptions = allDayOptions.slice(0, 3);
    if (dayOptions.length) {
      response
        .status(200)
        .send({ alternativeTimesText: getReadableTimesText(dayOptions) });
      return;
    }

    response
      .status(200)
      .send({ alternativeTimesText: "none for the given day" });
    return;
  }

  // Persist the new appointment

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

const makeDatetime = ({ date, time }: { date: string; time: string }): Date => {
  const dateInstance = new Date(date + " " + time + " +0");
  dateInstance.setUTCMilliseconds(0);
  return dateInstance;
};

const OPENING_HOUR = 9;
const OPENING_HOUR_TEXT = "9 AM";

const CLOSING_HOUR = 18;
const CLOSING_HOUR_TEXT = "6 PM";

const isWithinWorkingHours = (d: Date): boolean =>
  d.getUTCHours() >= OPENING_HOUR && d.getUTCHours() < CLOSING_HOUR;

const isValidTimeSlot = (d: Date): boolean =>
  d.getUTCMinutes() % MEETING_DURATION_IN_MINUTES === 0;

const APPOINTMENTS_PER_HOUR = 4;

const MEETING_DURATION_IN_MINUTES = 60 / APPOINTMENTS_PER_HOUR;

const getTimeSlots = (date: Date): Date[] => {
  if (!isWithinWorkingHours(date)) {
    return [];
  }

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
