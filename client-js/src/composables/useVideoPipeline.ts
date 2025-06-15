import type { Ref } from 'vue'
import { ExtensionHeaders } from '../../../../libs/moqtail-ts/src/model/extension_header/extension_header'
import { ObjectForwardingPreference, SubgroupHeaderType } from '../../../../libs/moqtail-ts/src/model/data/constant'
import { MoqtailClient } from '../../../../libs/moqtail-ts/src/client/client'
import { Announce, ClientSetup, GroupOrder, Subscribe } from '../../../../libs/moqtail-ts/src/model/control'
import { SetupParameters } from '../../../../libs/moqtail-ts/src/model/parameter/setup_parameter'
import { Tuple } from '../../../../libs/moqtail-ts/src/model/common/tuple'
import { LiveContentSource } from '../../../../libs/moqtail-ts/src/client/track/content_source'
import { FullTrackName, MoqtObject, SubgroupHeader } from '../../../../libs/moqtail-ts/src/model/data'
import { Location } from '../../../../libs/moqtail-ts/src/model/common/location'
import { SubgroupObject } from '../../../../libs/moqtail-ts/src/model/data'

const videoTrackAlias = 1n
const publisherPriority = 1

let videoGroupId = 1n
let videoObjectId = 0n
let isFirstKeyframeSent = false
let videoConfig: ArrayBuffer | null = null

export function useVideoPublisher(videoRef: Ref<HTMLVideoElement | null>, canvasRef: Ref<HTMLCanvasElement | null>) {
  const setup = async () => {
    console.debug('a')
    const video = videoRef.value
    const canvas = canvasRef.value
    if (!video) {
      console.error("Video element undefined")
      return
    }

    if (!canvas) {
      console.error("Canvas element undefined")
      return
    }
    console.debug('b')

    // Show local video only
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    video.srcObject = stream
    video.muted = true

    // Setup publishing pipeline
    const webTransport = await initTransport('https://localhost:4433')
    const setupParams = new SetupParameters()
    const clientSetup = new ClientSetup([0xff00000b], setupParams.build())
    const moqClient = await MoqtailClient.new(clientSetup, webTransport)

    const videoFullTrackName = FullTrackName.tryNew(Tuple.fromUtf8Path('/moqtail'), new TextEncoder().encode('demo'))!

    const announceMessage = new Announce(moqClient.nextClientRequestId, Tuple.fromUtf8Path('/moqtail'), [])
    await moqClient.announce(announceMessage)

    let videoStreamController: ReadableStreamDefaultController<MoqtObject> | null = null
    const videoStream = new ReadableStream<MoqtObject>({
      start(controller) {
        videoStreamController = controller
      },
      cancel() {
        videoStreamController = null
      },
    })
    const videoContentSource = new LiveContentSource(videoStream)

    moqClient.addOrUpdateTrack({
      fullTrackName: videoFullTrackName,
      trackAlias: videoTrackAlias,
      forwardingPreference: ObjectForwardingPreference.Subgroup,
      contentSource: videoContentSource,
    })


    let videoEncoder: VideoEncoder | null = null
    let videoReader: ReadableStreamDefaultReader<any> | null = null
    let encoderActive = true

    const createVideoEncoder = () => {
      isFirstKeyframeSent = false // Reset keyframe state on restart
      videoEncoder = new VideoEncoder({
        output: async (chunk, meta) => {
          if (chunk.type === 'key') {
            videoGroupId++
            videoObjectId = 0n
          }

          const locHeaders = new ExtensionHeaders()
            .addCaptureTimestamp(BigInt(chunk.timestamp))
            .addVideoFrameMarking(chunk.type === 'key' ? 1 : 0)

          const desc = meta?.decoderConfig?.description
          if (!isFirstKeyframeSent && desc instanceof ArrayBuffer) {
            videoConfig = desc
            locHeaders.addVideoConfig(new Uint8Array(desc))
            isFirstKeyframeSent = true
          }
          if (isFirstKeyframeSent && videoConfig instanceof ArrayBuffer) {
            locHeaders.addVideoConfig(new Uint8Array(videoConfig))
          }
          const frameData = new Uint8Array(chunk.byteLength)
          chunk.copyTo(frameData)

          const moqt = MoqtObject.newWithPayload(
            videoFullTrackName,
            new Location(videoGroupId, videoObjectId++),
            publisherPriority,
            ObjectForwardingPreference.Subgroup,
            0n,
            locHeaders.build(),
            frameData,
          )
          if (videoStreamController) {
            videoStreamController.enqueue(moqt)
          } else {
            console.error('videoStreamController is not available')
          }
        },
        error: console.error,
      })
      videoEncoder.configure({
        codec: 'avc1.42E01E',
        width: 640,
        height: 480,
        bitrate: 1_000_000,
        framerate: 30,
        avc: { format: 'avc' },
        latencyMode: 'realtime',
        hardwareAcceleration: 'prefer-software',
      })
    }

    createVideoEncoder()

    videoReader = new (window as any).MediaStreamTrackProcessor({
      track: stream.getVideoTracks()[0],
    }).readable.getReader()

    const readAndEncode = async (reader: ReadableStreamDefaultReader<any>) => {
      while (encoderActive) {
        const result = await reader.read()
        if (result.done) break
        videoEncoder?.encode(result.value)
        result.value.close()
      }
    }
    if (!videoReader) {
      console.error('Failed to create video reader')
      return
    }
    readAndEncode(videoReader)

    setInterval(() => {
      if (!videoEncoder) return
      videoEncoder.flush?.().finally(() => {
        videoEncoder?.close()
        videoEncoder = null
        createVideoEncoder()
      })
    }, 2000)

  }
  return { setup }
}

export function useVideoSubscriber(canvasRef: Ref<HTMLCanvasElement | null>) {
  const setup = async () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const webTransport = await initTransport('https://localhost:4433')
    const setupParams = new SetupParameters()
    const clientSetup = new ClientSetup([0xff00000b], setupParams.build())
    const moqClient = await MoqtailClient.new(clientSetup, webTransport)
    const videoFullTrackName = FullTrackName.tryNew(Tuple.fromUtf8Path('/moqtail'), new TextEncoder().encode('demo'))!
    const subscribeMessage = Subscribe.newLatestObject(
      moqClient.nextClientRequestId,
      videoTrackAlias,
      videoFullTrackName,
      0,
      GroupOrder.Original,
      true,
      [],
    )
    const worker = new Worker(new URL('@app/workers/decoderWorker.ts', import.meta.url), { type: 'module' })
    const offscreen = canvas.transferControlToOffscreen()
    worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen])
    console.log('Subscribing to video track:', videoFullTrackName)
    const moq_stream = await moqClient.subscribe(subscribeMessage)
    console.log('Subscribed to video track:', videoFullTrackName)
    if (moq_stream instanceof ReadableStream) {
      const reader = moq_stream.getReader()
      ;(async () => {
        while (true) {
          const { done, value: obj } = await reader.read()
          console.debug('Received object:', obj)
          if (!(obj instanceof MoqtObject)) throw new Error('Expected MoqtObject, got: ' + obj)
          if (done) break
          if (!obj.payload) {
            console.warn('Received MoqtObject without payload, skipping:', obj)
            continue
          }
          worker.postMessage({ type: 'moq', extentions: obj.extensionHeaders ,payload: obj }, [obj.payload.buffer])
        }
      })()
    } else {
      console.error('Subscribe failed:', moq_stream)
    }
  }
  return { setup }
}

async function initTransport(url: string) {
  const transport = new WebTransport(url)
  await transport.ready
  return transport
}
