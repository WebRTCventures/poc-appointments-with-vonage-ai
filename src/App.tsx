import "./App.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Appointment } from "./lib/domain";
import { seedTodayAppointments } from "./lib/infra-seeds";
import { listenAppointments } from "./lib/infra";
import { moveElement } from "./lib/utils";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).seedTodayAppointments = seedTodayAppointments;
