import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { Users, UserCheck, Calendar } from "lucide-react";
import { ref, get } from "firebase/database";
import { db } from "../firebase";

export default function Dashboard() {
    const [stats, setStats] = useState({
        patients: 0,
        doctors: 0,
        appointments: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Users (Patients)
                const usersSnap = await get(ref(db, 'users'));
                const usersCount = usersSnap.exists() ? Object.keys(usersSnap.val()).length : 0;

                // Fetch Doctors
                const doctorsSnap = await get(ref(db, 'doctors'));
                const doctorsCount = doctorsSnap.exists() ? Object.keys(doctorsSnap.val()).length : 0;

                // Fetch Appointments & Revenue
                const aptSnap = await get(ref(db, 'appointments'));
                let aptCount = 0;

                if (aptSnap.exists()) {
                    const data = aptSnap.val();
                    // Appointments are nested: appointments/{userId}/{aptId}
                    Object.values(data).forEach((userApts: any) => {
                        if (userApts) {
                            const apts = Object.values(userApts);
                            aptCount += apts.length;
                        }
                    });
                }

                setStats({
                    patients: usersCount,
                    doctors: doctorsCount,
                    appointments: aptCount
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <Layout>
            <div style={styles.grid}>
                <StatCard
                    title="Total Patients"
                    value={loading ? "..." : stats.patients}
                    icon={Users}
                    color="#3B82F6"
                    trend={loading ? "-" : "Realtime"}
                />
                <StatCard
                    title="Active Doctors"
                    value={loading ? "..." : stats.doctors}
                    icon={UserCheck}
                    color="#10B981"
                    trend={loading ? "-" : "Registered"}
                />
                <StatCard
                    title="Appointments"
                    value={loading ? "..." : stats.appointments}
                    icon={Calendar}
                    color="#F59E0B"
                    trend={loading ? "-" : "Total Bookings"}
                />
            </div>

            <div style={{ marginTop: '40px' }}>
                <h3>Recent Activity</h3>
                <div style={styles.placeholderChart}>
                    <p style={{ color: '#94A3B8' }}>Chart Visualization Coming Soon</p>
                </div>
            </div>
        </Layout>
    );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <div>
                    <p style={styles.cardTitle}>{title}</p>
                    <h3 style={styles.cardValue}>{value}</h3>
                </div>
                <div style={{ ...styles.iconBox, backgroundColor: `${color}20`, color: color }}>
                    <Icon size={24} />
                </div>
            </div>
            <div style={styles.cardFooter}>
                <span style={{ color: '#10B981', fontWeight: 500 }}>{trend}</span>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
    },
    card: {
        backgroundColor: 'var(--card)',
        padding: '24px',
        borderRadius: 'var(--radius)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid var(--border)',
        transition: 'all 0.2s',
        cursor: 'default'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    cardTitle: {
        fontSize: '14px',
        color: 'var(--muted-foreground)',
        fontWeight: 500,
        margin: '0 0 8px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    cardValue: {
        fontSize: '32px',
        fontWeight: 700,
        color: 'var(--card-foreground)',
        margin: 0,
        letterSpacing: '-0.025em'
    },
    iconBox: {
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Creating a subtle background based on the icon color passed in styles isn't strictly CSS variable compliant
        // but keeps the dynamic nature. We'll simplify the box style.
    },
    cardFooter: {
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--muted-foreground)'
    },
    placeholderChart: {
        height: '400px',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }
};
