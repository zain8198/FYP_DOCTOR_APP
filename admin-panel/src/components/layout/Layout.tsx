import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();

    return (
        <div style={styles.container}>
            <Sidebar />
            <main style={styles.main}>
                <header style={styles.header}>
                    <div style={styles.headerTitle}>Welcome, {currentUser?.email}</div>
                    <div style={styles.headerProfile}>
                        <div style={styles.avatar}>{currentUser?.email?.charAt(0).toUpperCase()}</div>
                    </div>
                </header>
                <div style={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC' // Slate 50
    },
    main: {
        flex: 1,
        marginLeft: '260px', // Matches new Sidebar width
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0 // Prevents flex overflow issues
    },
    header: {
        height: '64px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        position: 'sticky',
        top: 0,
        zIndex: 40
    },
    headerTitle: {
        fontSize: '14px',
        color: '#64748B', // Slate 500
        fontWeight: 500
    },
    headerProfile: {
        display: 'flex',
        alignItems: 'center'
    },
    avatar: {
        width: '32px',
        height: '32px',
        backgroundColor: '#0F172A', // Slate 900
        borderRadius: '50%',
        color: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    content: {
        padding: '40px',
        flex: 1,
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%'
    }
};
