import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { User, Lock, Bell, Moon, Sun, Shield, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Settings() {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    // Password Update State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleUpdatePassword = async () => {
        setMessage(null);
        if (!currentPassword || !newPassword) {
            setMessage({ type: 'error', text: "Please fill in all password fields." });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: "New password must be at least 6 characters." });
            return;
        }

        if (!currentUser || !currentUser.email) {
            setMessage({ type: 'error', text: "User not session found." });
            return;
        }

        setUpdating(true);
        try {
            // 1. Re-authenticate
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // 2. Update Password
            await updatePassword(currentUser, newPassword);

            setMessage({ type: 'success', text: "Password updated successfully!" });
            setCurrentPassword("");
            setNewPassword("");
        } catch (error: any) {
            console.error("Error updating password:", error);
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                setMessage({ type: 'error', text: "Incorrect current password." });
            } else if (error.code === 'auth/requires-recent-login') {
                setMessage({ type: 'error', text: "Please logout and login again to change password." });
            } else {
                setMessage({ type: 'error', text: "Failed to update password. Try again." });
            }
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Layout>
            <div style={styles.header}>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.5px' }}>Settings</h2>
                <p style={{ color: 'var(--muted-foreground)', marginTop: '6px' }}>Manage your account settings and preferences</p>
            </div>

            <div style={styles.container}>
                {/* Profile Section */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div style={{ ...styles.iconBox, color: '#3B82F6', backgroundColor: '#EFF6FF' }}>
                            <User size={20} />
                        </div>
                        <h3 style={styles.cardTitle}>Profile Settings</h3>
                    </div>
                    <div style={styles.cardContent}>
                        <div style={styles.profileInfo}>
                            <div style={styles.avatar}>
                                {currentUser?.email?.charAt(0).toUpperCase() || "A"}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: 'var(--card-foreground)' }}>
                                    {currentUser?.displayName || "Admin User"}
                                </h4>
                                <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: '14px' }}>
                                    {currentUser?.email || "admin@admin.com"}
                                </p>
                                <span style={styles.roleBadge}>Super Admin</span>
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input style={styles.input} value={currentUser?.email || ""} disabled />
                            <p style={styles.helperText}>Email cannot be changed directly.</p>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div style={{ ...styles.iconBox, color: '#10B981', backgroundColor: '#ECFDF5' }}>
                            <Shield size={20} />
                        </div>
                        <h3 style={styles.cardTitle}>Security & Password</h3>
                    </div>
                    <div style={styles.cardContent}>
                        {message && (
                            <div style={{
                                ...styles.alert,
                                backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                                color: message.type === 'success' ? '#059669' : '#DC2626',
                                borderColor: message.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                            }}>
                                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Current Password</label>
                            <div style={styles.inputWrapper}>
                                <Lock size={16} color="var(--muted-foreground)" style={{ marginLeft: '12px' }} />
                                <input
                                    style={styles.inputWithIcon}
                                    type="password"
                                    placeholder="Enter current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>New Password</label>
                            <div style={styles.inputWrapper}>
                                <Lock size={16} color="var(--muted-foreground)" style={{ marginLeft: '12px' }} />
                                <input
                                    style={styles.inputWithIcon}
                                    type="password"
                                    placeholder="Enter new password (min. 6 chars)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            style={{
                                ...styles.saveBtn,
                                opacity: updating ? 0.7 : 1,
                                cursor: updating ? 'not-allowed' : 'pointer'
                            }}
                            onClick={handleUpdatePassword}
                            disabled={updating}
                        >
                            {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {updating ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                </div>

                {/* Preferences Section */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div style={{ ...styles.iconBox, color: '#F59E0B', backgroundColor: '#FFFBEB' }}>
                            <Bell size={20} />
                        </div>
                        <h3 style={styles.cardTitle}>Preferences</h3>
                    </div>
                    <div style={styles.cardContent}>
                        <div style={styles.toggleRow}>
                            <div style={styles.toggleInfo}>
                                <div style={styles.toggleLabel}>
                                    <Bell size={16} />
                                    <span>Email Notifications</span>
                                </div>
                                <p style={styles.toggleDesc}>Receive emails about new doctor registrations</p>
                            </div>
                            <label style={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={notifications}
                                    onChange={(e) => setNotifications(e.target.checked)}
                                />
                                <span style={styles.slider}></span>
                            </label>
                        </div>

                        <div style={styles.divider}></div>

                        <div style={styles.toggleRow}>
                            <div style={styles.toggleInfo}>
                                <div style={styles.toggleLabel}>
                                    {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                                    <span>Dark Mode</span>
                                </div>
                                <p style={styles.toggleDesc}>Switch between light and dark themes</p>
                            </div>
                            <label style={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={darkMode}
                                    onChange={(e) => setDarkMode(e.target.checked)}
                                />
                                <span style={styles.slider}></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    header: {
        marginBottom: '32px'
    },
    container: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px'
    },
    card: {
        backgroundColor: 'var(--card)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
    },
    cardHeader: {
        padding: '24px', // Increased padding
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: 'var(--card)' // Cleaner look without colored header bg
    },
    iconBox: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    cardTitle: {
        margin: 0,
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--foreground)'
    },
    cardContent: {
        padding: '24px'
    },
    profileInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'var(--secondary)',
        borderRadius: 'var(--radius)'
    },
    avatar: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 700
    },
    roleBadge: {
        fontSize: '11px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        color: '#3B82F6',
        padding: '4px 10px',
        borderRadius: '20px',
        fontWeight: 600,
        marginTop: '6px',
        display: 'inline-block'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--foreground)',
        marginBottom: '8px'
    },
    input: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        fontSize: '14px',
        color: 'var(--muted-foreground)', // Disabled inputs look muted
        backgroundColor: 'var(--secondary)',
        outline: 'none',
        boxSizing: 'border-box'
    },
    helperText: {
        fontSize: '12px',
        color: 'var(--muted-foreground)',
        marginTop: '6px'
    },
    inputWrapper: {
        display: 'flex',
        alignItems: 'center',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        backgroundColor: 'var(--card)', // Active inputs are white
        overflow: 'hidden',
        transition: 'border-color 0.2s'
    },
    inputWithIcon: {
        flex: 1,
        padding: '10px 12px',
        border: 'none',
        outline: 'none',
        fontSize: '14px',
        color: 'var(--foreground)',
        backgroundColor: 'transparent'
    },
    saveBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 20px',
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        border: 'none',
        borderRadius: 'var(--radius)',
        fontWeight: 500,
        cursor: 'pointer',
        width: '100%',
        marginTop: '10px',
        transition: 'opacity 0.2s'
    },
    toggleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 0'
    },
    toggleInfo: {
        flex: 1
    },
    toggleLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 500,
        color: 'var(--foreground)',
        marginBottom: '4px'
    },
    toggleDesc: {
        margin: 0,
        fontSize: '13px',
        color: 'var(--muted-foreground)'
    },
    divider: {
        height: '1px',
        backgroundColor: 'var(--border)',
        margin: '20px 0'
    },
    alert: {
        padding: '12px',
        borderRadius: 'var(--radius)',
        border: '1px solid transparent',
        marginBottom: '20px',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    switch: {
        position: 'relative',
        display: 'inline-block',
        width: '44px',
        height: '24px'
    },
    slider: {
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#CBD5E1',
        transition: '.4s',
        borderRadius: '34px'
    }
};
