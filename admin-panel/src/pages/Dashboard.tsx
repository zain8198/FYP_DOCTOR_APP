import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { Users, UserCheck, Calendar } from "lucide-react";
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState({
        patients: 0,
        doctors: 0,
        appointments: 0
    });
    const [chartData, setChartData] = useState<{ name: string, appointments: number }[]>([]);
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

                // Initialize last 7 days
                const aptDates: Record<string, number> = {};
                const last7Days = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
                    last7Days.push(dateStr);
                    aptDates[dateStr] = 0;
                }

                if (aptSnap.exists()) {
                    const data = aptSnap.val();
                    // Appointments are nested: appointments/{userId}/{aptId}
                    Object.values(data).forEach((userApts: any) => {
                        if (userApts) {
                            Object.values(userApts).forEach((apt: any) => {
                                aptCount++;
                                if (apt.dateIso && aptDates.hasOwnProperty(apt.dateIso)) {
                                    aptDates[apt.dateIso]++;
                                }
                            });
                        }
                    });
                }

                // Format data for Recharts
                const formattedChartData = last7Days.map(dateStr => {
                    const d = new Date(dateStr);
                    // Fix timezone issue by treating string as local date components or just appending T00:00
                    // Actually, simple day name derivation:
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    return {
                        name: dayName,
                        appointments: aptDates[dateStr]
                    };
                });

                setStats({
                    patients: usersCount,
                    doctors: doctorsCount,
                    appointments: aptCount
                });
                setChartData(formattedChartData);

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
                <h3 style={styles.sectionTitle}>Appointment Trends (Last 7 Days)</h3>
                <div style={styles.chartContainer}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            Loading chart...
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748B', fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F1F5F9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar
                                    dataKey="appointments"
                                    fill="#3B82F6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                    name="Appointments"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
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
    },
    cardFooter: {
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--muted-foreground)'
    },
    sectionTitle: {
        fontSize: '18px',
        fontWeight: 600,
        marginBottom: '20px',
        color: '#1E293B'
    },
    chartContainer: {
        height: '400px',
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }
};
