import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BrowserQRCodeReader } from "@zxing/browser"
import { BarcodeFormat, DecodeHintType } from "@zxing/library"
import axios, { AxiosError } from "axios"
import { Buffer } from 'buffer'

function App() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hints = useMemo(() => new Map(), [])
  const formats = [BarcodeFormat.QR_CODE]
  hints.set(DecodeHintType.CHARACTER_SET, 'ISO-8859-1')
  hints.set(DecodeHintType.TRY_HARDER, true)
  hints.set(DecodeHintType.POSSIBLE_FORMATS, formats)
  const codeReader = useMemo(() => new BrowserQRCodeReader(hints), [hints])

  async function vioDecode(file: Uint8Array) {
    try {
      const { data } = await axios.post('https://gateway.apiserpro.serpro.gov.br/viodec-trial/v1/decode', file, {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer 06aef429-a981-3ec5-a1f8-71d38d86481e',
          "Content-Type": 'application/octet-stream'
        }
      })

      alert(JSON.stringify(data))
    } catch (error) {
      if (error instanceof AxiosError) {
        alert(JSON.stringify(error.response))
      }
    }
  }

  const decodeOnce = useCallback(() => {
    if (videoRef.current && selectedDeviceId) {
      codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, async (result, error, controls) => {
        if (error) {
          return console.error(error)
        }

        controls.stop()
        if (result) {
          const str = result.toString() 
          const buf = new Buffer(str, 'latin1')

          vioDecode(buf)
        }
      })
    }
  }, [codeReader, selectedDeviceId])

  useEffect(() => {
    async function loadVideoInputDevices() {
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices()
      
      setSelectedDeviceId(videoInputDevices[0].deviceId)
    }

    loadVideoInputDevices()
  }, [])
  return (
    <>
      <h1>ZXing QRCode Scanner - ReactJS</h1>
      <video ref={videoRef} width={400} height={320} style={{ border: '1px solid gray' }}></video>
      <button type="button" onClick={decodeOnce}>Start</button>
    </>
  )
}

export default App
