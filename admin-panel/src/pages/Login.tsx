import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError("");
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/"); // Redirect to dashboard
        } catch (err: any) {
            console.error(err);
            setError("Failed to login. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTestUser = async () => {
        try {
            setLoading(true);
            const email = "super_admin@doctorapp.com";
            const pass = "admin123456";

            await createUserWithEmailAndPassword(auth, email, pass);
            setEmail(email);
            setPassword(pass);
            setError("User created! Click Login now.");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setEmail("super_admin@doctorapp.com");
                setPassword("admin123456");
                setError("User already exists. Credentials auto-filled. Try logging in.");
            } else if (err.code === 'auth/operation-not-allowed') {
                setError("Error: Email/Password Sign-in is not enabled in Firebase Console.");
            } else {
                setError("Failed to create user: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Admin Login</h2>
                {error && <div style={styles.error}>{error}</div>}
                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={styles.input}
                            placeholder="••••••••"
                        />
                    </div>
                    <button disabled={loading} type="submit" style={styles.button}>
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    <button
                        type="button"
                        onClick={handleCreateTestUser}
                        disabled={loading}
                        style={{ ...styles.button, backgroundColor: '#6c757d', marginTop: '10px' }}
                    >
                        Create Test Admin (super_admin@doctorapp.com)
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f0f2f5"
    },
    card: {
        width: "100%", maxWidth: "400px", padding: "40px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    title: {
        textAlign: "center", marginBottom: "20px", color: "#333"
    },
    error: {
        marginBottom: "15px", padding: "10px", backgroundColor: "#ffebee", color: "#c62828", borderRadius: "4px", fontSize: "14px"
    },
    form: {
        display: "flex", flexDirection: "column", gap: "15px"
    },
    inputGroup: {
        display: "flex", flexDirection: "column", gap: "5px"
    },
    label: {
        fontSize: "14px", color: "#555", fontWeight: "500"
    },
    input: {
        padding: "10px", borderRadius: "4px", border: "1px solid #ddd", fontSize: "16px"
    },
    button: {
        padding: "12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", fontSize: "16px", cursor: "pointer", fontWeight: "600", marginTop: "10px"
    }
};
