import React, { useEffect, useState } from "react";
import Layout from "../../components/layout/Layout";
import {
    Search, Eye, Check, X, Mail, Phone, MapPin,
    Calendar, DollarSign, Star, FileText, Building,
    User, Clock, Shield
} from "lucide-react";
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
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E293B' }}>Doctors Management</h2>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img
                                                src={doc.image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                                alt=""
                                                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                                                }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 500, color: '#0F172A' }}>{doc.name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748B' }}>{doc.email || 'No email'}</div>
                                            </div>
                                        </div>
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
                title="" // Empty title as we have a custom header
            >
                {selectedDoctor && (
                    <div style={styles.modalContent}>
                        {/* Profile Header */}
                        <div style={styles.profileHeader}>
                            <img
                                src={selectedDoctor.image || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                alt="Profile"
                                style={styles.profileImage}
                                onError={(e) => {
                                    e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                                }}
                            />
                            <h2 style={styles.doctorName}>{selectedDoctor.name}</h2>
                            <p style={styles.doctorSpecialty}>{selectedDoctor.specialty}</p>
                            <div style={{ marginTop: '8px' }}>
                                <StatusBadge status={selectedDoctor.status || 'pending'} />
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div style={styles.section}>
                            <h4 style={styles.sectionTitle}>About</h4>
                            <p style={styles.bioText}>{selectedDoctor.bio || "No biography available for this doctor."}</p>
                        </div>

                        {/* Details Grid */}
                        <div style={styles.gridContainer}>
                            <DetailItem icon={<Mail size={16} />} label="Email" value={selectedDoctor.email} />
                            <DetailItem icon={<Phone size={16} />} label="Phone" value={selectedDoctor.phone || selectedDoctor.phoneNumber} />
                            <DetailItem icon={<Clock size={16} />} label="Experience" value={selectedDoctor.experience ? `${selectedDoctor.experience} Years` : 'N/A'} />
                            <DetailItem icon={<Star size={16} />} label="Rating" value={selectedDoctor.rating ? `${selectedDoctor.rating} ⭐` : 'N/A'} />
                            <DetailItem icon={<User size={16} />} label="Patients" value={selectedDoctor.patients?.toString()} />
                            <DetailItem icon={<DollarSign size={16} />} label="Consultation" value={selectedDoctor.consultationFee || selectedDoctor.price ? `$${selectedDoctor.consultationFee || selectedDoctor.price}` : 'N/A'} />
                            {selectedDoctor.clinic && <DetailItem icon={<Building size={16} />} label="Clinic" value={selectedDoctor.clinic} />}
                            {selectedDoctor.licenseNumber && <DetailItem icon={<Shield size={16} />} label="License No" value={selectedDoctor.licenseNumber} />}
                        </div>

                        <div style={{ ...styles.gridContainer, marginTop: '16px', gridTemplateColumns: '1fr' }}>
                            <DetailItem icon={<MapPin size={16} />} label="Address" value={selectedDoctor.address || selectedDoctor.location} />
                        </div>

                        {/* License Document */}
                        {selectedDoctor.licenseDocumentUrl && (
                            <div style={styles.section}>
                                <h4 style={styles.sectionTitle}>Medical License</h4>
                                <div style={styles.licenseContainer}>
                                    <a href={selectedDoctor.licenseDocumentUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={selectedDoctor.licenseDocumentUrl}
                                            alt="Medical License"
                                            style={styles.licenseImage}
                                        />
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={styles.modalActions}>
                            {selectedDoctor.status !== 'rejected' && (
                                <button
                                    style={{ ...styles.modalBtn, backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5' }}
                                    onClick={() => handleUpdateStatus('rejected')}
                                >
                                    <X size={18} /> Reject Application
                                </button>
                            )}

                            {selectedDoctor.status !== 'approved' && (
                                <button
                                    style={{ ...styles.modalBtn, backgroundColor: '#10B981', color: 'white' }}
                                    onClick={() => handleUpdateStatus('approved')}
                                >
                                    <Check size={18} /> Approve Doctor
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
}

const DetailItem = ({ icon, label, value }: { icon: any, label: string, value?: string | number }) => (
    <div style={styles.detailItem}>
        <div style={styles.detailIcon}>{icon}</div>
        <div>
            <div style={styles.detailLabel}>{label}</div>
            <div style={styles.detailValue}>{value || 'N/A'}</div>
        </div>
    </div>
);

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
            textTransform: 'capitalize',
            display: 'inline-block'
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
        gap: '8px',
        width: '300px'
    },
    input: {
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        width: '100%'
    },
    select: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#64748B'
    },
    tableContainer: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        border: '1px solid #E2E8F0'
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
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #E2E8F0'
    },
    td: {
        padding: '16px 24px',
        borderBottom: '1px solid #F1F5F9',
        color: '#334155',
        fontSize: '14px'
    },
    tr: {
        transition: 'background-color 0.2s'
    },
    actionBtn: {
        border: 'none',
        background: '#EFF6FF',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s'
    },
    // Modal Styles
    modalContent: {
        padding: '0 10px 10px 10px',
        color: '#334155'
    },
    profileHeader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '24px',
        textAlign: 'center'
    },
    profileImage: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '4px solid #F8FAFC',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '16px'
    },
    doctorName: {
        margin: '0 0 4px 0',
        fontSize: '20px',
        fontWeight: 700,
        color: '#0F172A'
    },
    doctorSpecialty: {
        margin: '0',
        color: '#64748B',
        fontSize: '14px',
        fontWeight: 500
    },
    section: {
        marginBottom: '24px'
    },
    sectionTitle: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '12px',
        borderBottom: '1px solid #F1F5F9',
        paddingBottom: '8px'
    },
    bioText: {
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#475569',
        margin: 0
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px'
    },
    detailItem: {
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        backgroundColor: '#F8FAFC',
        padding: '12px',
        borderRadius: '8px'
    },
    detailIcon: {
        color: '#3B82F6',
        marginTop: '2px'
    },
    detailLabel: {
        fontSize: '11px',
        color: '#64748B',
        textTransform: 'uppercase',
        fontWeight: 600,
        marginBottom: '2px'
    },
    detailValue: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#1E293B',
        wordBreak: 'break-word'
    },
    licenseContainer: {
        backgroundColor: '#F8FAFC',
        padding: '16px',
        borderRadius: '8px',
        border: '1px dashed #CBD5E1',
        display: 'flex',
        justifyContent: 'center'
    },
    licenseImage: {
        maxWidth: '100%',
        maxHeight: '200px',
        borderRadius: '4px',
        cursor: 'zoom-in'
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
        marginTop: '32px',
        paddingTop: '20px',
        borderTop: '1px solid #F1F5F9'
    },
    modalBtn: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 20px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
    }
};
