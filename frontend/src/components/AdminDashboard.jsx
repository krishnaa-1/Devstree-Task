import React, { useState } from "react";
import api from '../axios';
import "./AdminDashboard.css";

function AdminDashboard() {
    const [date, setDate] = useState("");
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);  // To disable buttons during booking

    function formatDate(dateString) {
        const dateObj = new Date(dateString);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    async function fetchAvailability() {
        if (!date) {
            alert("Please select a date first.");
            return;
        }

        setLoading(true);
        setErrorMessage("");

        try {
            const formattedDate = formatDate(date);
            const response = await api.get(`/api/availability/${formattedDate}`);
            setSlots(response.data.slots);
        } catch (error) {
            const message =
                error.response?.data?.message || error.response?.data?.error || "Error fetching availability";
            setErrorMessage(message);
            setSlots([]);
        }
        finally {
            setLoading(false);
        }
    }
     const handleLogout = () => {
    // Remove token from localStorage or cookie
    localStorage.removeItem("token"); // assuming token key is 'token'

    // Optionally redirect or reload
    window.location.href = "/login"; // redirect to login page
    // or window.location.reload();
  };

    // New function to book slot
    async function handleBookSlot(slot) {
        if (!date) {
            alert("Select a date first");
            return;
        }
        if (!slot.availabilityId?.userId?._id) {
            alert("User ID not found for this slot.");
            return;
        }

        setBookingLoading(true);
        setErrorMessage("");

        try {
            const response = await api.post("api/availability/book", {
                date: formatDate(date),
                startTime: slot.startTime,
                userId: slot.availabilityId.userId._id,
            });

            alert(response.data.message || "Slot booked successfully");
            // Refresh slots after booking
            fetchAvailability();
        } catch (error) {
            const message =
                error.response?.data?.error || "Error booking slot";
            setErrorMessage(message);
        } finally {
            setBookingLoading(false);
        }
    }

    return (
        <div className="admin-dashboard">
            <header className="admin-topbar">
                <div>
                    <span className="admin-kicker">Care operations</span>
                    <h2>Admin Dashboard</h2>
                    <p>Welcome, Admin. Review provider availability and book patient slots.</p>
                </div>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </header>

            <main className="admin-content">
                <section className="admin-control-panel">
                    <div className="panel-heading">
                        <span className="panel-icon">+</span>
                        <div>
                            <h3>Find Available Care Slots</h3>
                            <p>Select a date to view appointment windows.</p>
                        </div>
                    </div>

                    <div className="date-picker">
                        <label>
                            <span>Select Date</span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </label>
                        <button onClick={fetchAvailability} disabled={loading || bookingLoading}>
                            View Available Slots
                        </button>
                    </div>
                </section>

                <section className="admin-results">
                    {loading ? (
                        <p className="loading">Loading slots...</p>
                    ) : errorMessage ? (
                        <p className="error-message">{errorMessage}</p>
                    ) : slots.length > 0 ? (
                        <div className="slots-table-container">
                            <div className="slots-heading">
                                <div>
                                    <span className="admin-kicker">Appointment list</span>
                                    <h3>Available Slots for {date}</h3>
                                </div>
                                <span className="slot-count">{slots.length} slots</span>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Status</th>
                                        <th>User Name</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {slots.map((slot) => (
                                        <tr key={slot._id}>
                                            <td>{slot.startTime}</td>
                                            <td>{slot.endTime}</td>
                                            <td>
                                                <span className={`status-pill status-${slot.status.toLowerCase()}`}>
                                                    {slot.status}
                                                </span>
                                            </td>
                                            <td>{slot.availabilityId?.userId?.username || "N/A"}</td>
                                            <td>
                                                {slot.status === "Available" ? (
                                                    <button
                                                        className="book-button"
                                                        onClick={() => handleBookSlot(slot)}
                                                        disabled={bookingLoading}
                                                    >
                                                        Book Slot
                                                    </button>
                                                ) : (
                                                    <span className="empty-action">--</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="no-slots">No available slots found for this date.</p>
                    )}
                </section>
            </main>
        </div>
    );
}

export default AdminDashboard;
