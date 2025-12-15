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
        backgroundColor: '#F1F5F9' // Slate 100
    },
    main: {
        flex: 1,
        marginLeft: '250px', // Sidebar width
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        height: '64px',
        backgroundColor: 'white',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px'
    },
    headerTitle: {
        fontSize: '16px',
        color: '#334155',
        fontWeight: 600
    },
    headerProfile: {
        display: 'flex',
        alignItems: 'center'
    },
    avatar: {
        width: '36px',
        height: '36px',
        backgroundColor: '#3B82F6',
        borderRadius: '50%',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold'
    },
    content: {
        padding: '32px',
        flex: 1
    }
};
