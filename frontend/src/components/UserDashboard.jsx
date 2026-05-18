import React, { useState } from "react";
import api from '../axios';
import "./UserDashboard.css";

function convertTo12Hour(time24) {
  const [hourStr, minute] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12; 
  return `${hour.toString().padStart(2, "0")}:${minute} ${ampm}`;
}

function UserDashboard() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!date || !startTime || !endTime) {
      setError("Please fill all fields.");
      return;
    }

    if (new Date(date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
      setError("Date cannot be in the past.");
      return;
    }

    const startTime12 = convertTo12Hour(startTime);
    const endTime12 = convertTo12Hour(endTime);

    const toMinutes = (time24) => {
      const [h, m] = time24.split(":");
      return parseInt(h, 10) * 60 + parseInt(m, 10);
    };
    if (toMinutes(startTime) >= toMinutes(endTime)) {
      setError("Start time must be earlier than end time.");
      return;
    }

    try {
      await api.post("/api/availability", {
        date,
        startTime: startTime12,
        endTime: endTime12,
      });
      setSuccess("Availability added successfully!");
      setDate("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      const message = err.response?.data?.error || "Failed to add availability.";
      setError(message);
      console.error(err);
    }
  };

  const handleLogout = () => {
    // Remove token from localStorage or cookie
    localStorage.removeItem("token"); // assuming token key is 'token'

    // Optionally redirect or reload
    window.location.href = "/login"; // redirect to login page
    // or window.location.reload();
  };

  return (
    <div className="user-dashboard">
      <header className="user-topbar">
        <div>
          <span className="user-kicker">Provider portal</span>
          <h2>User Dashboard</h2>
          <p>Welcome, User. Share your care availability for upcoming bookings.</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </header>

      <main className="user-content">
        <section className="user-summary" aria-label="Availability summary">
          <div className="summary-item">
            <span className="summary-label">Today</span>
            <strong>Ready</strong>
            <p>Publish accurate appointment windows for care coordinators.</p>
          </div>
          <div className="summary-item">
            <span className="summary-label">Workflow</span>
            <strong>Availability</strong>
            <p>Choose a date and time range to make booking easier.</p>
          </div>
        </section>

        <section className="availability-panel">
          <div className="panel-heading">
            <span className="panel-icon">+</span>
            <div>
              <h3>Add Availability</h3>
              <p>Set the appointment window you want to offer.</p>
            </div>
          </div>

          <form className="availability-form" onSubmit={handleSubmit}>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>

            <div className="time-grid">
              <label>
                <span>Start Time</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </label>

              <label>
                <span>End Time</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </label>
            </div>

            <button type="submit">Add Availability</button>
          </form>

          {error && <p className="message error">{error}</p>}
          {success && <p className="message success">{success}</p>}
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;
