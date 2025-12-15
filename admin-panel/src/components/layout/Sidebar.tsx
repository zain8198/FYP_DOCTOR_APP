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
        width: '250px',
        height: '100vh',
        backgroundColor: '#1E293B', // Slate 800
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0
    },
    logoContainer: {
        padding: '24px',
        borderBottom: '1px solid #334155'
    },
    logo: {
        margin: 0,
        fontSize: '20px',
        color: '#60A5FA' // Blue 400
    },
    nav: {
        flex: 1,
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    link: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 24px',
        color: '#94A3B8',
        textDecoration: 'none',
        transition: 'all 0.2s',
        fontWeight: 500
    },
    activeLink: {
        backgroundColor: '#334155',
        color: 'white',
        borderRight: '3px solid #60A5FA'
    },
    footer: {
        padding: '20px',
        borderTop: '1px solid #334155'
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'none',
        border: 'none',
        color: '#F87171', // Red 400
        cursor: 'pointer',
        fontSize: '16px',
        width: '100%',
        padding: '10px'
    }
};
