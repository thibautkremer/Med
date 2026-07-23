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

// Global Error & Promise Rejection Interceptors for mobile/android debugging
if (typeof window !== 'undefined') {
    // 1. Capture unhandled runtime exceptions
    window.addEventListener('error', (event) => {
        const message = event.error ? (event.error.stack || event.error.message) : event.message;
        errorService.log(`[Exception] ${message}`, 'error');
    });

    // 2. Capture unhandled Promise rejections (e.g., failed fetch, API errors)
    window.addEventListener('unhandledrejection', (event) => {
        let message = 'Promise Rejection';
        if (event.reason) {
            if (event.reason instanceof Error) {
                message = event.reason.stack || event.reason.message;
            } else if (typeof event.reason === 'object') {
                try {
                    message = JSON.stringify(event.reason);
                } catch {
                    message = String(event.reason);
                }
            } else {
                message = String(event.reason);
            }
        }
        errorService.log(`[Rejection] ${message}`, 'error');
    });

    // 3. Capture all console.error calls
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
        // Forward to original console.error so it still shows in devtools/browser logs
        originalConsoleError.apply(console, args);

        // Convert args to string
        const message = args
            .map(arg => {
                if (arg instanceof Error) {
                    return arg.stack || arg.message;
                }
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch {
                        return String(arg);
                    }
                }
                return String(arg);
            })
            .join(' ');

        // Prevent infinite loop if something in errorService triggers console.error
        if (!message.includes('[Exception]') && !message.includes('[Rejection]') && !message.includes('[Console Error]')) {
            errorService.log(`[Console] ${message}`, 'error');
        }
    };
}

