import { ref } from 'vue';

const socket = ref<WebSocket | null>(null);
const apiUrl = import.meta.env.VITE_API_URL;
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
        };

        socket.value.onmessage = (event) => {
            const message: { type: string, data: string } = JSON.parse(event.data);
            messages.value.push(message);
        };

        socket.value.onclose = () => {
            isConnected.value = false;
            socket.value = null;
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

    async function fetchAPIRoute(route: string) {
        const response = await fetch(`${apiUrl}/api/${route}`);
        if (!response.ok) {
            throw new Error(`Error fetching ${route}: ${response.statusText}`);
        }
        return response.json();
    }

    return {
        connect,
        sendMessage,
        fetchAPIRoute,
        isConnected,
        messages,
    };
}