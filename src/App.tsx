import axios, { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { Buffer } from 'buffer'
import './styles.css'

interface IOption {
  value: string
  label: string
}

function App() {
  const [devicesOptions, setDevicesOptions] = useState<IOption[]>([])
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
      const { data } = await axios.post(
        'https://gateway.apiserpro.serpro.gov.br/viodec-trial/v1/decode',
        file,
        {
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer 06aef429-a981-3ec5-a1f8-71d38d86481e',
            'Content-Type': 'application/octet-stream',
          },
        },
      )

      alert(JSON.stringify(data))
    } catch (error) {
      if (error instanceof AxiosError) {
        alert(JSON.stringify(error.response))
      }
    }
  }

  const decodeOnce = useCallback(() => {
    if (videoRef.current && selectedDeviceId) {
      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        async (result, error, controls) => {
          if (error) {
            return console.error(error)
          }

          controls.stop()
          if (result) {
            const str = result.toString()
            const buf = Buffer.from(str, 'latin1')

            vioDecode(buf)
          }
        },
      )
    }
  }, [codeReader, selectedDeviceId])

  useEffect(() => {
    async function loadVideoInputDevices() {
      const videoInputDevices =
        await BrowserQRCodeReader.listVideoInputDevices()

      if (videoInputDevices.length === 0) {
        return alert('Nenhum dispositivo encontrado')
      }

      setDevicesOptions(
        videoInputDevices.map((device) => ({
          value: device.deviceId,
          label: device.label,
        })),
      )

      setSelectedDeviceId(videoInputDevices[0].deviceId)
    }

    loadVideoInputDevices()
  }, [])
  return (
    <main>
      <h1>ZXing QRCode Scanner</h1>
      <video ref={videoRef}></video>
      <button type="button" onClick={decodeOnce}>
        Start
      </button>
      <select name="devices" id="devices">
        {devicesOptions.map((deviceOption) => (
          <option key={deviceOption.value} value={deviceOption.value}>
            {deviceOption.label}
          </option>
        ))}
      </select>
    </main>
  )
}

export default App
