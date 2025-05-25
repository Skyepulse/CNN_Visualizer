import { useWebSocket } from '@src/composables/useWebSocket'
const { sendMessage } = useWebSocket()

export const sendImageData = (imageData: string, real:number|null = -1, client_name:string = "") => {

    if (! imageData || imageData.length === 0) {
        console.error("Invalid image data provided to sendImageData.")
        return
    }

    if ( real === null || real === undefined || real < 0 || real > 9) {
      real = -1
    }

    const base64Data = imageData.split(',')[1]

    const sendJSON = {
      data: base64Data,
      name: client_name,
      real: real
    }

    sendMessage("mnist-image", JSON.stringify(sendJSON))
}