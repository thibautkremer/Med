export type LogEntry = {
    id: string;
    type: 'info' | 'error' | 'success' | 'action';
    message: string;
    timestamp: number;
};

const logs: LogEntry[] = [];
let listeners: (() => void)[] = [];

export const errorService = {
    log: (message: string, type: 'info' | 'error' | 'success' | 'action' = 'error') => {
        const prefix = type === 'error' ? '❌ ERROR' : type === 'success' ? '✅ SUCCESS' : type === 'action' ? '⚡ ACTION' : 'ℹ️ INFO';
        console.log(`[${prefix}] ${message}`);
        logs.unshift({
            id: Math.random().toString(),
            type,
            message,
            timestamp: Date.now()
        });
        if (logs.length > 200) logs.pop();
        listeners.forEach(l => {
            try { l(); } catch (e) { console.error(e); }
        });
    },
    action: (message: string) => {
        errorService.log(message, 'action');
    },
    success: (message: string) => {
        errorService.log(message, 'success');
    },
    info: (message: string) => {
        errorService.log(message, 'info');
    },
    getErrors: () => [...logs],
    subscribe: (listener: () => void) => {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },
    clear: () => {
        logs.length = 0;
        listeners.forEach(l => {
            try { l(); } catch (e) { console.error(e); }
        });
    }
};
