import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import { Search, Eye } from "lucide-react";
import { ref, get } from "firebase/database";
import { db } from "../firebase";
import Modal from "../components/common/Modal";

interface Patient {
    id: string;
    name: string;
    email: string;
    image?: string;
    createdAt?: number;
    totalAppointments?: number;
}

export default function Patients() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            // 1. Fetch Users
            const usersRef = ref(db, 'users');
            const usersSnap = await get(usersRef);

            // 2. Fetch Appointments for counts
            const aptRef = ref(db, 'appointments');
            const aptSnap = await get(aptRef);
            const aptData = aptSnap.exists() ? aptSnap.val() : {};

            if (usersSnap.exists()) {
                const data = usersSnap.val();
                const patientList = Object.keys(data).map(key => {
                    // Calculate Total Appointments for this user
                    const userApts = aptData[key] ? Object.keys(aptData[key]).length : 0;

                    return {
                        id: key,
                        name: data[key].name || "Unknown User",
                        email: data[key].email || "No Email",
                        image: data[key].image,
                        totalAppointments: userApts
                    };
                });
                setPatients(patientList.reverse());
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleView = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsModalOpen(true);
    };

    return (
        <Layout>
            <div style={styles.header}>
                <h2>Patients Management</h2>
                <div style={styles.searchBox}>
                    <Search size={18} color="#64748B" />
                    <input
                        style={styles.input}
                        placeholder="Search patients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Patient</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Total Bookings</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={styles.td}>Loading...</td></tr>
                        ) : filteredPatients.length === 0 ? (
                            <tr><td colSpan={4} style={styles.td}>No patients found</td></tr>
                        ) : (
                            filteredPatients.map(patient => (
                                <tr key={patient.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img
                                                src={patient.image || `https://ui-avatars.com/api/?name=${patient.name}&background=random`}
                                                alt="Avatar"
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                            />
                                            <span style={{ fontWeight: 500 }}>{patient.name}</span>
                                        </div>
                                    </td>
                                    <td style={styles.td}>{patient.email}</td>
                                    <td style={styles.td}>
                                        <span style={styles.badge}>{patient.totalAppointments} Bookings</span>
                                    </td>
                                    <td style={styles.td}>
                                        <button
                                            style={styles.actionBtn}
                                            onClick={() => handleView(patient)}
                                            title="View Details"
                                        >
                                            <Eye size={18} color="#3B82F6" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Patient Details"
            >
                {selectedPatient && (
                    <div style={{ textAlign: 'center' }}>
                        <img
                            src={selectedPatient.image || `https://ui-avatars.com/api/?name=${selectedPatient.name}&background=random`}
                            style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '15px' }}
                        />
                        <h3>{selectedPatient.name}</h3>
                        <p style={{ color: '#64748B' }}>{selectedPatient.email}</p>

                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                            <strong style={{ display: 'block', fontSize: '24px', color: '#3B82F6' }}>{selectedPatient.totalAppointments}</strong>
                            <span style={{ color: '#64748B', fontSize: '14px' }}>Total Appointments Booked</span>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'
    },
    searchBox: {
        display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', gap: '8px'
    },
    input: {
        border: 'none', outline: 'none', fontSize: '14px', width: '250px'
    },
    tableContainer: {
        backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden'
    },
    table: {
        width: '100%', borderCollapse: 'collapse', textAlign: 'left'
    },
    th: {
        padding: '16px 24px', backgroundColor: '#F8FAFC', color: '#64748B', fontWeight: 600, fontSize: '14px', borderBottom: '1px solid #E2E8F0'
    },
    td: {
        padding: '16px 24px', borderBottom: '1px solid #E2E8F0', color: '#334155'
    },
    tr: {
        cursor: 'pointer'
    },
    badge: {
        backgroundColor: '#E3F2FD', color: '#1976D2', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600
    },
    actionBtn: {
        border: 'none', background: 'none', cursor: 'pointer', padding: '4px'
    }
};
