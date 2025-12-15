import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { TextInput, IconButton, Surface, Text, useTheme } from "react-native-paper";
import ThemedBackground from "../../components_legacy/ui/ThemedBackground";

export default function ChatBotScreen() {
    const [messages, setMessages] = useState<{ id: string, text: string, sender: 'user' | 'bot' }[]>([
        { id: '1', text: "Hello! I am your health assistant. How can I help you today?", sender: 'bot' }
    ]);
    const [text, setText] = useState("");
    const theme = useTheme();

    const handleSend = () => {
        if (!text.trim()) return;
        const newMsg = { id: Date.now().toString(), text, sender: 'user' as const };
        setMessages(prev => [...prev, newMsg]);
        setText("");

        // Simulate bot response
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now().toString(), text: "I'm essentially a placeholder bot right now, but I'll be smarter soon!", sender: 'bot' }]);
        }, 1000);
    };

    return (
        <ThemedBackground style={{ padding: 0 }}>
            <View style={styles.header}>
                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>AI Assistant</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                    <View style={[
                        styles.messageBubble,
                        item.sender === 'user'
                            ? { alignSelf: 'flex-end', backgroundColor: theme.colors.primaryContainer }
                            : { alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceVariant }
                    ]}>
                        <Text style={{ color: item.sender === 'user' ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}>
                            {item.text}
                        </Text>
                    </View>
                )}
            />

            <Surface style={styles.inputContainer} elevation={4}>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message..."
                    mode="flat"
                    style={styles.input}
                    underlineColor="transparent"
                />
                <IconButton icon="send" mode="contained" onPress={handleSend} />
            </Surface>
        </ThemedBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center'
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        height: 50,
    },
});
