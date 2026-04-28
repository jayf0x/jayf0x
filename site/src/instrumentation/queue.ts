import { nanoid } from "nanoid"

export type EventType =
  | "USER_EVENT"
  | "STATE_UPDATE"
  | "RENDER"
  | "QUERY_START"
  | "QUERY_SUCCESS"

export interface InstrumentationEvent {
  cascadeId: string
  type: EventType
  nodeId: string
  timestamp: number
}

type Subscriber = (event: InstrumentationEvent) => void

const RING_SIZE = 256

class InstrumentationQueue {
  private buffer: (InstrumentationEvent | null)[] = new Array(RING_SIZE).fill(null)
  private head = 0
  private cascadeId: string = nanoid()
  private subscribers: Set<Subscriber> = new Set()

  getCascadeId(): string {
    return this.cascadeId
  }

  newCascade(): string {
    this.cascadeId = nanoid()
    return this.cascadeId
  }

  emit(type: EventType, nodeId: string, cascadeId?: string): void {
    const event: InstrumentationEvent = {
      cascadeId: cascadeId ?? this.cascadeId,
      type,
      nodeId,
      timestamp: Date.now(),
    }
    this.buffer[this.head % RING_SIZE] = event
    this.head++
    this.subscribers.forEach((cb) => cb(event))
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb)
    return () => this.subscribers.delete(cb)
  }
}

export const queue = new InstrumentationQueue()
