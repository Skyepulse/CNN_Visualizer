import { ref } from 'vue';

const socket = ref<WebSocket | null>(null);
const isConnected = ref(false);
const messages = ref<{ type: string, data: string }[]>([]);

export function useWebSocket(url: string = '') {
    const connect = () => {
        if (socket.value) {
            return;
        }
        socket.value = new WebSocket(url);

        socket.value.onopen = () => {
            isConnected.value = true;
            sendMessage("simple-message", "Hello from Vue!");
            console.log('WebSocket connected');
        };

        socket.value.onmessage = (event) => {
            const message: { type: string, data: string } = JSON.parse(event.data);
            messages.value.push(message);
            console.log('Message received of type:', message.type);
        };

        socket.value.onclose = () => {
            isConnected.value = false;
            socket.value = null;
            console.log('WebSocket disconnected');
        };
    }

    const sendMessage = ( type: string, data: string) => {
        if (socket.value === null || !isConnected.value) {
            return;
        }

        if (data !== null && data !== undefined && type !== null && type !== undefined && type !== "") {
            const message = {'type': type, 'data': data}
            socket.value.send(JSON.stringify(message))
        }
        else {
            console.error("Invalid message data or type when trying to send.")
        }
    }

    return {
        connect,
        sendMessage,
        isConnected,
        messages,
    };
}