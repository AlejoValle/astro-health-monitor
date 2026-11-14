// Bluetooth SIG Heart Rate Service (0x180D), Heart Rate Measurement characteristic (0x2A37).
const HEART_RATE_SERVICE = 'heart_rate'
const HEART_RATE_MEASUREMENT = 'heart_rate_measurement'

export const bluetoothSupported = () => typeof navigator !== 'undefined' && 'bluetooth' in navigator

/** Flags bit 0 selects the value format: 0 = uint8, 1 = uint16 little-endian. */
export function parseHeartRate(data: DataView): number {
  const sixteenBit = (data.getUint8(0) & 0x01) === 1
  return sixteenBit ? data.getUint16(1, true) : data.getUint8(1)
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

export interface HeartRateLink {
  deviceName: string
  disconnect: () => void
}

/** Must be called from a user gesture. Rejects if the user cancels the device picker. */
export async function connectHeartRate(
  onBpm: (bpm: number) => void,
  onDisconnect: () => void,
): Promise<HeartRateLink> {
  const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [HEART_RATE_SERVICE] }] })
  if (!device.gatt) throw new Error('This device does not offer a Bluetooth connection.')

  device.addEventListener('gattserverdisconnected', onDisconnect)
  const server = await device.gatt.connect()
  const service = await server.getPrimaryService(HEART_RATE_SERVICE)
  const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT)
  characteristic.addEventListener('characteristicvaluechanged', () => {
    if (characteristic.value) onBpm(parseHeartRate(characteristic.value))
  })
  await characteristic.startNotifications()

  return {
    deviceName: device.name ?? 'Heart rate sensor',
    disconnect: () => {
      device.removeEventListener('gattserverdisconnected', onDisconnect)
      device.gatt?.disconnect()
    },
  }
}
