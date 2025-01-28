type Listener<T> = (value: T) => void;
type Observable<T> = {
    subscribe: (listener: Listener<T>) => () => void;
    value: () => T | typeof NO_VALUE;
};

const NO_VALUE = Symbol('NO_VALUE');

// Create an observable that can be subscribed to
function chain<T>(
    addListenerFn: (emit: Listener<T>) => void
): Observable<T> {
    let currentValue: T | typeof NO_VALUE = NO_VALUE;
    const listeners = new Set<Listener<T>>();

    const subscribe = (listener: Listener<T>) => {
        listeners.add(listener);
        
        // If there's a current value, immediately call the new listener
        if (currentValue !== NO_VALUE) {
            listener(currentValue);
        }

        // Return an unsubscribe function
        return () => {
            listeners.delete(listener);
        };
    };

    const originalRemover = addListenerFn((value: T) => {
        currentValue = value;
        listeners.forEach(listener => listener(value));
    });

    return {
        subscribe,
        value: () => currentValue
    };
}

// OnEach utility to register a listener
function onEach<T>(observable: Observable<T>, listener: Listener<T>): () => void {
    return observable.subscribe(listener);
}

// Debounce utility
function debounce<T>(observable: Observable<T>, delay: number, fireInitial: boolean = true): Observable<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let currentValue: T | typeof NO_VALUE = NO_VALUE;
    const listeners = new Set<Listener<T>>();
    let initialFired = !fireInitial;

    const debouncedSubscribe = (listener: Listener<T>) => {
        listeners.add(listener);
        
        // If there's a current value, call listener after delay or immediately if fireInitial is true
        if (currentValue !== NO_VALUE) {
            if (timeoutId) clearTimeout(timeoutId);
            if (initialFired) {
                timeoutId = setTimeout(() => {
                    listeners.forEach(listener => listener(currentValue as T));
                }, delay);
            } else {
                listener(currentValue as T);
                initialFired = true;
            }
        }

        return () => {
            listeners.delete(listener);
            if (listeners.size === 0 && timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };
    };

    const unsubscribe = observable.subscribe((value: T) => {
        currentValue = value;
        
        // Clear previous timeout
        if (timeoutId) clearTimeout(timeoutId);
        
        // Set new timeout
        timeoutId = setTimeout(() => {
            listeners.forEach(listener => listener(value));
        }, delay);
    });

    return {
        subscribe: debouncedSubscribe,
        value: () => currentValue
    };
}

// Zip utility with variadic generics
function zip<T extends any[]>(
    ...observables: { [K in keyof T]: Observable<T[K]> }
): Observable<T> {
    const listeners = new Set<Listener<T>>();
    const values = observables.map(() => NO_VALUE) as T;
    let filledCount = 0;
    const totalObservables = observables.length;

    const checkAndNotify = () => {
        if (filledCount === totalObservables) {
            listeners.forEach(listener => listener(values));
        }
    };

    const subscribeFns = observables.map((observable, index) => 
        observable.subscribe((value: T[number]) => {
            const newFill = values[index] === NO_VALUE;
            values[index] = value;
            
            // Only increment if this index wasn't previously filled
            if (newFill) {
                filledCount++;
            }
            
            checkAndNotify();
        })
    );

    return {
        subscribe: (listener: Listener<T>) => {
            listeners.add(listener);
            
            // If all values are already filled, immediately call the listener
            if (filledCount === totalObservables) {
                listener(values);
            }
            
            return () => {
                listeners.delete(listener);
            };
        },
        value: () => filledCount === totalObservables ? values : NO_VALUE
    };
}

function filter<T>(
    observable: Observable<T>,
    predicate: (value: T) => boolean
): Observable<T> {
    let currentValue: T | typeof NO_VALUE = NO_VALUE;
    const listeners = new Set<Listener<T>>();

    const subscribe = (listener: Listener<T>) => {
        listeners.add(listener);
        
        // If there's a current value, immediately call the new listener
        if (currentValue !== NO_VALUE) {
            listener(currentValue);
        }

        // Return an unsubscribe function
        return () => {
            listeners.delete(listener);
        };
    };

    const originalRemover = observable.subscribe((value: T) => {
        if (predicate(value)) {
            currentValue = value;
            listeners.forEach(listener => listener(value));
        }
    });

    return {
        subscribe,
        value: () => currentValue
    };
}

function filterType<T, U extends T>(
    observable: Observable<T>,
    predicate: (value: T) => value is U
): Observable<U> {
    let currentValue: U | typeof NO_VALUE = NO_VALUE;
    const listeners = new Set<Listener<U>>();

    const subscribe = (listener: Listener<U>) => {
        listeners.add(listener);
        
        // If there's a current value, immediately call the new listener
        if (currentValue !== NO_VALUE) {
            listener(currentValue);
        }

        // Return an unsubscribe function
        return () => {
            listeners.delete(listener);
        };
    };

    const originalRemover = observable.subscribe((value: T) => {
        if (predicate(value)) {
            currentValue = value;
            listeners.forEach(listener => listener(value));
        }
    });

    return {
        subscribe,
        value: () => currentValue
    };
}

function map<T, R>(
    observable: Observable<T>,
    transform: (value: T) => R,
): Observable<R> {
    let currentValue: R | typeof NO_VALUE = NO_VALUE;
    const listeners = new Set<Listener<R>>();

    const subscribe = (listener: Listener<R>) => {
        listeners.add(listener);
        
        // If there's a current value, immediately call the new listener
        if (currentValue !== NO_VALUE) {
            listener(currentValue);
        }

        // Return an unsubscribe function
        return () => {
            listeners.delete(listener);
        };
    };

    const originalRemover = observable.subscribe((value: T) => {
        currentValue = transform(value);
        listeners.forEach(listener => listener(currentValue as R));
    });

    return {
        subscribe,
        value: () => currentValue
    };
}

export { chain, onEach, debounce, zip, filter, filterType, map, NO_VALUE };