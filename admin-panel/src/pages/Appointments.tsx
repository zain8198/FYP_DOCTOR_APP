import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { Search, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Check, X, Eye, Filter } from "lucide-react";
import { ref, get, update } from "firebase/database";
import { db } from "../firebase";

interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    doctor: string;
    doctorId?: string;
    date: string;
    time: string;
    status: string;
    type?: string;
    details?: string;
}

export default function Appointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const aptRef = ref(db, 'appointments');
            const snapshot = await get(aptRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                let allAppointments: Appointment[] = [];

                // Flatten the structure: users -> appointments
                Object.keys(data).forEach(userId => {
                    const userApts = data[userId];
                    Object.keys(userApts).forEach(aptId => {
                        const apt = userApts[aptId];
                        allAppointments.push({
                            id: aptId,
                            patientId: userId,
                            patientName: apt.patientName || "Unknown Patient",
                            doctor: apt.doctor,
                            date: apt.date,
                            time: apt.time,
                            status: apt.status || "Pending",
                            details: apt.details,
                            ...apt
                        });
                    });
                });

                setAppointments(allAppointments.reverse());
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (apt: Appointment, newStatus: string) => {
        try {
            const aptRef = ref(db, `appointments/${apt.patientId}/${apt.id}`);
            await update(aptRef, { status: newStatus });

            setAppointments(current =>
                current.map(a => a.id === apt.id ? { ...a, status: newStatus } : a)
            );
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        }
    };

    const filteredAppointments = appointments.filter(apt => {
        const matchesSearch =
            apt.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apt.patientName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === "All" || apt.status.toLowerCase() === filterStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        let color = "#64748B";
        let bg = "#F1F5F9";
        let icon = <AlertCircle size={14} strokeWidth={2.5} />;
        const s = status.toLowerCase();

        if (s === 'confirmed') {
            color = "#059669"; // Emerald 600
            bg = "#D1FAE5"; // Emerald 100
            icon = <CheckCircle size={14} strokeWidth={2.5} />;
        } else if (s === 'completed') {
            color = "#2563EB"; // Blue 600
            bg = "#DBEAFE"; // Blue 100
            icon = <CheckCircle size={14} strokeWidth={2.5} />;
        } else if (s === 'cancelled') {
            color = "#DC2626"; // Red 600
            bg = "#FEE2E2"; // Red 100
            icon = <XCircle size={14} strokeWidth={2.5} />;
        } else if (s === 'pending') {
            color = "#D97706"; // Amber 600
            bg = "#FEF3C7"; // Amber 100
            icon = <Clock size={14} strokeWidth={2.5} />;
        }

        return (
            <span style={{
                backgroundColor: bg,
                color: color,
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'capitalize',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
                {icon} {status}
            </span>
        );
    };

    return (
        <Layout>
            <div style={styles.pageHeader}>
                <div>
                    <h1 style={styles.pageTitle}>Appointments</h1>
                    <p style={styles.pageSubtitle}>Monitor and manage all patient appointments</p>
                </div>
                <div style={styles.controls}>
                    <div style={styles.filterWrapper}>
                        <Filter size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <select
                            style={styles.select}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div style={styles.searchBox}>
                        <Search size={18} color="#64748B" />
                        <input
                            style={styles.input}
                            placeholder="Search doctors, patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Doctor Information</th>
                            <th style={styles.th}>Patient Name</th>
                            <th style={styles.th}>Schedule</th>
                            <th style={styles.th}>Status</th>
                            <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', padding: '40px' }}>
                                <div style={{ color: '#64748B' }}>Loading appointments...</div>
                            </td></tr>
                        ) : filteredAppointments.length === 0 ? (
                            <tr><td colSpan={5} style={{ ...styles.td, textAlign: 'center', padding: '40px' }}>
                                <div style={{ color: '#64748B' }}>No appointments found matching your criteria.</div>
                            </td></tr>
                        ) : (
                            filteredAppointments.map(apt => (
                                <tr key={apt.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={styles.avatarPlaceholder}>
                                                {apt.doctor.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={styles.doctorName}>Dr. {apt.doctor}</div>
                                                <div style={styles.doctorSpecialty}>{apt.type || "General"}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.patientName}>{apt.patientName}</div>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.dateTimeContainer}>
                                            <div style={styles.dateTag}>
                                                <Calendar size={14} /> {apt.date}
                                            </div>
                                            <div style={styles.timeTag}>
                                                <Clock size={14} /> {apt.time || "10:00 AM"}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.td}>
                                        {getStatusBadge(apt.status)}
                                    </td>
                                    <td style={{ ...styles.td, textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {/* Accept Action */}
                                            {apt.status.toLowerCase() === 'pending' && (
                                                <button
                                                    style={{ ...styles.actionBtn, ...styles.btnSuccess }}
                                                    title="Confirm Appointment"
                                                    onClick={() => handleStatusUpdate(apt, 'confirmed')}
                                                >
                                                    <Check size={18} />
                                                </button>
                                            )}

                                            {/* Cancel Action */}
                                            {(apt.status.toLowerCase() === 'pending' || apt.status.toLowerCase() === 'confirmed') && (
                                                <button
                                                    style={{ ...styles.actionBtn, ...styles.btnDestructive }}
                                                    title="Cancel Appointment"
                                                    onClick={() => {
                                                        if (window.confirm("Are you sure you want to cancel this appointment?")) {
                                                            handleStatusUpdate(apt, 'cancelled');
                                                        }
                                                    }}
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}

                                            <button
                                                style={{ ...styles.actionBtn, ...styles.btnInfo }}
                                                title="View Details"
                                                onClick={() => alert("Details: " + (apt.details || "No details provided"))}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    pageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '20px'
    },
    pageTitle: {
        fontSize: '28px',
        fontWeight: 700,
        color: 'var(--foreground)',
        margin: 0,
        letterSpacing: '-0.5px'
    },
    pageSubtitle: {
        color: 'var(--muted-foreground)',
        fontSize: '15px',
        marginTop: '6px'
    },
    controls: {
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
    },
    filterWrapper: {
        position: 'relative',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '10px 16px',
        gap: '10px',
        width: '300px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease'
    },
    input: {
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        width: '100%',
        color: 'var(--foreground)'
    },
    select: {
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '10px 16px 10px 36px',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: 'var(--card)',
        color: 'var(--card-foreground)',
        appearance: 'none',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        fontWeight: 500
    },
    tableCard: {
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        overflow: 'hidden',
        border: '1px solid var(--border)'
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0',
        textAlign: 'left'
    },
    th: {
        padding: '20px 24px',
        backgroundColor: 'var(--muted)',
        color: 'var(--muted-foreground)',
        fontWeight: 600,
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid var(--border)'
    },
    td: {
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
        color: 'var(--card-foreground)',
        fontSize: '14px',
        verticalAlign: 'middle'
    },
    tr: {
        transition: 'background-color 0.1s ease',
        cursor: 'default'
    },
    avatarPlaceholder: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        backgroundColor: 'var(--secondary)',
        color: 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '16px'
    },
    doctorName: {
        fontWeight: 600,
        color: 'var(--card-foreground)',
        fontSize: '15px'
    },
    doctorSpecialty: {
        color: 'var(--muted-foreground)',
        fontSize: '13px'
    },
    patientName: {
        fontWeight: 500,
        color: 'var(--card-foreground)'
    },
    dateTimeContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    dateTag: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--card-foreground)',
        fontSize: '14px',
        fontWeight: 500
    },
    timeTag: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--muted-foreground)',
        fontSize: '13px'
    },
    actionBtn: {
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
    },
    btnSuccess: {
        color: 'var(--success)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)'
    },
    btnDestructive: {
        color: 'var(--destructive)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)'
    },
    btnInfo: {
        color: 'var(--info)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)'
    }
};
