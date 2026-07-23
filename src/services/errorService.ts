type AppError = { id: string, message: string, timestamp: number };
const errors: AppError[] = [];

export const errorService = {
    log: (message: string) => {
        console.error('App Error:', message);
        errors.push({ id: Math.random().toString(), message, timestamp: Date.now() });
    },
    getErrors: () => [...errors]
};
