
import React, { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import { Search, Eye, Check, X } from "lucide-react";
import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";
import Modal from "../../components/common/Modal";

interface Doctor {
    id: string;
    name: string;
    specialty: string;
    email?: string;
    status?: string;
    createdAt?: number;
    experience?: string;
    bio?: string;
    image?: string;
    rating?: number;
    price?: number;
    phone?: string;
    phoneNumber?: string;
    address?: string;
    location?: string;
    patients?: number;
    clinic?: string;
    consultationFee?: string;
    licenseNumber?: string;
    licenseDocumentUrl?: string;
}

export default function DoctorList() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const doctorsRef = ref(db, 'doctors');
            const snapshot = await get(doctorsRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const docList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort by new first
                setDoctors(docList.reverse());
            }
        } catch (error) {
            console.error("Error fetching doctors:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedDoctor) return;
        try {
            const docRef = ref(db, `doctors/${selectedDoctor.id}`);
            await update(docRef, { status });

            // Update local state
            setDoctors(doctors.map(d => d.id === selectedDoctor.id ? { ...d, status } : d));
            setSelectedDoctor({ ...selectedDoctor, status });
            alert(`Doctor ${status} successfully!`);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status.");
        }
    };

    const handleView = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setIsModalOpen(true);
    };

    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "All" || (doc.status || 'pending') === filterStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <Layout>
            <div style={styles.header}>
                <h2>Doctors Management</h2>
                <div style={styles.actions}>
                    <div style={styles.searchBox}>
                        <Search size={18} color="#64748B" />
                        <input
                            style={styles.input}
                            placeholder="Search doctors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        style={styles.select}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Specialty</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={styles.td}>Loading...</td></tr>
                        ) : filteredDoctors.length === 0 ? (
                            <tr><td colSpan={4} style={styles.td}>No doctors found</td></tr>
                        ) : (
                            filteredDoctors.map(doc => (
                                <tr key={doc.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <div style={{ fontWeight: 500 }}>{doc.name}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>{doc.email || 'No email'}</div>
                                    </td>
                                    <td style={styles.td}>{doc.specialty}</td>
                                    <td style={styles.td}>
                                        <StatusBadge status={doc.status || 'pending'} />
                                    </td>
                                    <td style={styles.td}>
                                        <button
                                            style={styles.actionBtn}
                                            onClick={() => handleView(doc)}
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
                title="Doctor Details"
            >
                {selectedDoctor && (
                    <div>
                        <div style={styles.detailRow}>
                            <img
                                src={selectedDoctor.image || 'https://via.placeholder.com/100'}
                                alt="Profile"
                                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                                <h3 style={{ margin: '0 0 5px 0' }}>{selectedDoctor.name}</h3>
                                <p style={{ margin: 0, color: '#64748B' }}>{selectedDoctor.specialty} • {selectedDoctor.experience || 'N/A'}</p>
                                <StatusBadge status={selectedDoctor.status || 'pending'} />
                            </div>
                        </div>

                        <div style={styles.detailSection}>
                            <strong>Bio:</strong>
                            <p>{selectedDoctor.bio || "No bio available."}</p>
                        </div>

                        <div style={styles.detailSection}>
                            <strong>Price:</strong> ${selectedDoctor.consultationFee || selectedDoctor.price || 'N/A'} <br />
                            <strong>Rating:</strong> {selectedDoctor.rating || 'N/A'} ⭐ <br />
                            <strong>Patients:</strong> {selectedDoctor.patients || 'N/A'} <br />
                            <strong>Phone:</strong> {selectedDoctor.phone || selectedDoctor.phoneNumber || 'N/A'} <br />
                            <strong>Clinic:</strong> {selectedDoctor.clinic || 'N/A'} <br />
                            <strong>License No:</strong> {selectedDoctor.licenseNumber || 'N/A'} <br />
                            <strong>Address:</strong> {selectedDoctor.address || selectedDoctor.location || 'N/A'} <br />
                            <strong>Experience:</strong> {selectedDoctor.experience || 'N/A'} Years <br />
                            <strong>Email:</strong> {selectedDoctor.email}
                        </div>

                        {selectedDoctor.licenseDocumentUrl && (
                            <div style={styles.detailSection}>
                                <strong>License Document:</strong>
                                <div style={{ marginTop: '10px' }}>
                                    <a href={selectedDoctor.licenseDocumentUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={selectedDoctor.licenseDocumentUrl}
                                            alt="Medical License"
                                            style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #E2E8F0', maxHeight: '300px', objectFit: 'contain' }}
                                        />
                                    </a>
                                </div>
                            </div>
                        )}

                        <div style={styles.modalActions}>
                            {selectedDoctor.status !== 'rejected' && (
                                <button
                                    style={{ ...styles.modalBtn, backgroundColor: '#EF4444', color: 'white' }}
                                    onClick={() => handleUpdateStatus('rejected')}
                                >
                                    <X size={16} /> Reject
                                </button>
                            )}

                            {selectedDoctor.status !== 'approved' && (
                                <button
                                    style={{ ...styles.modalBtn, backgroundColor: '#10B981', color: 'white' }}
                                    onClick={() => handleUpdateStatus('approved')}
                                >
                                    <Check size={16} /> Approve
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        approved: { bg: '#DCFCE7', text: '#166534' },
        pending: { bg: '#FEF9C3', text: '#854D0E' },
        rejected: { bg: '#FEE2E2', text: '#991B1B' }
    };
    const style = colors[status.toLowerCase()] || colors.pending;

    return (
        <span style={{
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: style.bg,
            color: style.text,
            textTransform: 'capitalize'
        }}>
            {status}
        </span>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
    },
    actions: {
        display: 'flex',
        gap: '12px'
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '8px 12px',
        gap: '8px'
    },
    input: {
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        width: '200px'
    },
    select: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        backgroundColor: 'white',
        cursor: 'pointer'
    },
    tableContainer: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left'
    },
    th: {
        padding: '16px 24px',
        backgroundColor: '#F8FAFC',
        color: '#64748B',
        fontWeight: 600,
        fontSize: '14px',
        borderBottom: '1px solid #E2E8F0'
    },
    td: {
        padding: '16px 24px',
        borderBottom: '1px solid #E2E8F0',
        color: '#334155'
    },
    tr: {
        cursor: 'pointer' // Add hover effect in CSS later
    },
    actionBtn: {
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '4px'
    },
    detailRow: {
        display: 'flex',
        gap: '20px',
        marginBottom: '20px',
        alignItems: 'center'
    },
    detailSection: {
        marginBottom: '15px',
        lineHeight: 1.5
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '30px',
        borderTop: '1px solid #E2E8F0',
        paddingTop: '20px'
    },
    modalBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: 'pointer'
    }
};

