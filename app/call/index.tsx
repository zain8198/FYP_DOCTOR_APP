import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { auth, db } from '../../firebase';
import { ref, update } from 'firebase/database';
import {
    createAgoraRtcEngine,
    ChannelProfileType,
    ClientRoleType,
    IRtcEngine,
    RtcSurfaceView,
    RtcConnection,
    VideoSourceType,
} from 'react-native-agora';

import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

const AGORA_APP_ID = Constants.expoConfig?.extra?.EXPO_PUBLIC_AGORA_APP_ID || "YOUR_AGORA_APP_ID";

export default function VideoCallScreen() {
    const router = useRouter();
    const { appointmentId, patientId, doctorName, patientName, role } = useLocalSearchParams();

    const [isJoined, setIsJoined] = useState(false);
    const [remoteUid, setRemoteUid] = useState<number>(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const engine = useRef<IRtcEngine | null>(null);

    useEffect(() => {
        initAgora();

        const timer = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(timer);
            leaveChannel();
        };
    }, []);

    const initAgora = async () => {
        try {
            engine.current = createAgoraRtcEngine();
            engine.current.initialize({
                appId: AGORA_APP_ID,
                channelProfile: ChannelProfileType.ChannelProfileCommunication,
            });

            engine.current.registerEventHandler({
                onJoinChannelSuccess: (connection: RtcConnection, elapsed: number) => {
                    console.log('Successfully joined channel: ', connection.channelId);
                    setIsJoined(true);
                },
                onUserJoined: (connection: RtcConnection, uid: number, elapsed: number) => {
                    console.log('Remote user joined with uid: ', uid);
                    setRemoteUid(uid);
                },
                onUserOffline: (connection: RtcConnection, uid: number, reason: number) => {
                    console.log('Remote user offline: ', uid);
                    setRemoteUid(0);
                },
                onLeaveChannel: (connection: RtcConnection, stats: any) => {
                    console.log('Left channel');
                    setIsJoined(false);
                }
            });

            engine.current.enableVideo();
            engine.current.startPreview();

            // Join the channel (using appointmentId as channel name)
            engine.current.joinChannel('', appointmentId as string, 0, {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            });

        } catch (e) {
            console.error('Agora init error:', e);
        }
    };

    const leaveChannel = async () => {
        try {
            if (engine.current) {
                engine.current.leaveChannel();
                engine.current.release();
            }
        } catch (e) {
            console.error('Agora leave error:', e);
        }
    };

    const handleEndCall = async () => {
        if (appointmentId && patientId) {
            const callRef = ref(db, `appointments/${patientId}/${appointmentId}`);
            await update(callRef, { callStatus: 'ended' });
        }
        await leaveChannel();
        router.back();
    };

    const toggleMute = () => {
        engine.current?.muteLocalAudioStream(!isMuted);
        setIsMuted(!isMuted);
    };

    const toggleVideo = () => {
        engine.current?.muteLocalVideoStream(!isVideoOff);
        setIsVideoOff(!isVideoOff);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            {/* Main Video View (Remote User) */}
            <View style={styles.remoteVideoContainer}>
                {remoteUid !== 0 ? (
                    <RtcSurfaceView
                        canvas={{ uid: remoteUid }}
                        style={styles.remoteVideo}
                    />
                ) : (
                    <View style={styles.waitingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.waitingText}>Waiting for {role === 'doctor' ? 'Patient' : 'Doctor'}...</Text>
                    </View>
                )}
            </View>

            {/* Local Preview (Self) */}
            <View style={styles.localVideoContainer}>
                {!isVideoOff ? (
                    <RtcSurfaceView
                        canvas={{ uid: 0 }}
                        style={styles.localVideo}
                        zOrderMediaOverlay={true}
                    />
                ) : (
                    <View style={[styles.localVideo, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="videocam-off" size={24} color="#FFF" />
                    </View>
                )}
            </View>

            {/* Top Bar Info */}
            <SafeAreaView style={styles.topBar}>
                <View style={styles.infoContainer}>
                    <Text style={styles.timer}>{formatTime(callDuration)}</Text>
                    <Text style={styles.callerName}>{role === 'doctor' ? patientName : `Dr. ${doctorName}`}</Text>
                </View>
            </SafeAreaView>

            {/* Bottom Controls */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                    onPress={toggleMute}
                >
                    <Ionicons name={isMuted ? "mic-off" : "mic"} size={26} color={isMuted ? "#FFF" : "#333"} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.endCallButton]}
                    onPress={handleEndCall}
                >
                    <Ionicons name="close" size={32} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
                    onPress={toggleVideo}
                >
                    <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={26} color={isVideoOff ? "#FFF" : "#333"} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A',
    },
    remoteVideoContainer: {
        flex: 1,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    remoteVideo: {
        width: '100%',
        height: '100%',
    },
    waitingContainer: {
        alignItems: 'center',
    },
    waitingText: {
        color: '#AAA',
        marginTop: 20,
        fontSize: 16,
        fontWeight: '500',
    },
    localVideoContainer: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 120,
        height: 180,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        backgroundColor: '#222',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    localVideo: {
        flex: 1,
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    infoContainer: {
        padding: 20,
        alignItems: 'center',
    },
    timer: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    callerName: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 5,
        fontWeight: '600',
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonActive: {
        backgroundColor: Colors.error,
    },
    endCallButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: Colors.error,
    },
});
