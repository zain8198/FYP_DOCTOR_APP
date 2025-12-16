import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Stethoscope,
    Users,
    Calendar,
    DollarSign,
    MessageSquare,
    Settings,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
    const location = useLocation();
    const { logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Stethoscope, label: 'Doctors', path: '/doctors' },
        { icon: Users, label: 'Patients', path: '/patients' },
        { icon: Calendar, label: 'Appointments', path: '/appointments' },
        { icon: DollarSign, label: 'Financials', path: '/financials' },
        { icon: MessageSquare, label: 'Disputes', path: '/disputes' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div style={styles.sidebar}>
            <div style={styles.logoContainer}>
                <h2 style={styles.logo}>Admin Panel</h2>
            </div>

            <nav style={styles.nav}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                ...styles.link,
                                ...(isActive ? styles.activeLink : {})
                            }}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div style={styles.footer}>
                <button onClick={logout} style={styles.logoutBtn}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    sidebar: {
        width: '260px',
        height: '100vh',
        backgroundColor: '#0F172A', // Slate 900
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)',
        zIndex: 50
    },
    logoContainer: {
        padding: '24px 32px',
        borderBottom: '1px solid #1E293B' // Slate 800
    },
    logo: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 700,
        color: '#F8FAFC',
        letterSpacing: '-0.025em',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    nav: {
        flex: 1,
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto'
    },
    link: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        color: '#94A3B8', // Slate 400
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        fontWeight: 500,
        borderRadius: '8px',
        fontSize: '14px'
    },
    activeLink: {
        backgroundColor: '#1E293B', // Slate 800
        color: '#F8FAFC', // Slate 50
        fontWeight: 600
    },
    footer: {
        padding: '24px',
        borderTop: '1px solid #1E293B',
        backgroundColor: '#0F172A'
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'none',
        border: 'none',
        color: '#EF4444', // Red 500
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        transition: 'background-color 0.2s'
    }
};
