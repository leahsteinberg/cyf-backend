import { EventEmitter } from 'events';
import type { AppEvent } from './event-types.js';

class EventBus extends EventEmitter {
    private static instance: EventBus;

    private constructor() {
        super();
        this.setMaxListeners(20);
    }

    static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    emitEvent<T extends AppEvent>(event: T): boolean {
        console.log(`[EventBus] Emitting: ${event.type}`, {
            timestamp: new Date().toISOString(),
            ...event
        });
        return super.emit(event.type, event);
    }

    onEvent<T extends AppEvent['type']>(
        eventType: T,
        handler: (event: Extract<AppEvent, { type: T }>) => void | Promise<void>
    ): this {
        return super.on(eventType, handler);
    }
}

export const eventBus = EventBus.getInstance();
