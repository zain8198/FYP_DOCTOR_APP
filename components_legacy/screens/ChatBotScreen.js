import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const ChatBotScreen = () => {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: 'https://www.chatbase.co/chatbot-iframe/hdR9RtPKepPZvXC8gjnQS' }} // Replace with your chatbot ID
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default ChatBotScreen;
