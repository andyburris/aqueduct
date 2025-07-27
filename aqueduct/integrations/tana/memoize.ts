// Status tracking for memoization
const enum Status {
    NotStarted,
    InProgress,
    Complete
  }
  
  interface MemoEntry<T> {
    status: Status;
    value?: T;
    placeholder?: T;
  }
  
  export function createCyclicMemoization<Args extends any[], Return extends {}>(
    keyFn: (...args: Args) => string
  ) {
    const cache = new Map<string, MemoEntry<Return>>();
    
    return function memoize<T extends (...args: Args) => Return>(fn: T): T {
      return ((...args: Args) => {
        const key = keyFn(...args);
        let entry = cache.get(key);
        
        if (!entry) {
          entry = { status: Status.NotStarted };
          cache.set(key, entry);
        }
        
        switch (entry.status) {
          case Status.Complete:
            return entry.value!;
            
          case Status.InProgress:
            // Return the placeholder that will be populated later
            return entry.placeholder!;
            
          case Status.NotStarted:
            // Create placeholder object and mark as in progress
            entry.status = Status.InProgress;
            entry.placeholder = {} as Return; // This will be mutated
            
            // Calculate the actual value
            const result = fn(...args);
            
            // Copy all properties from result to placeholder
            Object.assign(entry.placeholder, result);
            
            // Mark as complete
            entry.status = Status.Complete;
            entry.value = entry.placeholder;
            
            return entry.placeholder;
        }
      }) as T;
    };
  }
  
  // Basic usage:
  // const memoized = createCyclicMemoization((...args) => JSON.stringify(args))(myFunction);
  
  // For object arguments that might have cycles:
  // const memoized = createCyclicMemoization(
  //   (obj, id) => `${obj.constructor.name}:${id}`
  // )(myFunction);
  
  // Advanced version with custom placeholder creation
  // Useful when you need specific default values or want to optimize memory usage
  export function createAdvancedCyclicMemoization<Args extends any[], Return extends {}>(
    keyFn: (...args: Args) => string,
    createPlaceholder: () => Return
  ) {
    const cache = new Map<string, MemoEntry<Return>>();
    
    return function memoize<T extends (...args: Args) => Return>(fn: T): T {
      return ((...args: Args) => {
        const key = keyFn(...args);
        let entry = cache.get(key);
        
        if (!entry) {
          entry = { status: Status.NotStarted };
          cache.set(key, entry);
        }
        
        switch (entry.status) {
          case Status.Complete:
            return entry.value!;
            
          case Status.InProgress:
            return entry.placeholder!;
            
          case Status.NotStarted:
            entry.status = Status.InProgress;
            entry.placeholder = createPlaceholder();
            
            const result = fn(...args);
            Object.assign(entry.placeholder, result);
            
            entry.status = Status.Complete;
            entry.value = entry.placeholder;
            
            return entry.placeholder;
        }
      }) as T;
    };
  }

  // Enhanced version with parameterized placeholder creation
  // Allows the placeholder creation function to receive the same arguments as the memoized function
  export function createParameterizedCyclicMemoization<Args extends any[], Return extends {}>(
    keyFn: (...args: Args) => string,
    createPlaceholder: (...args: Args) => Return
  ) {
    const cache = new Map<string, MemoEntry<Return>>();
    
    return function memoize<T extends (...args: Args) => Return>(fn: T): T {
      return ((...args: Args) => {
        const key = keyFn(...args);
        let entry = cache.get(key);
        
        if (!entry) {
          entry = { status: Status.NotStarted };
          cache.set(key, entry);
        }
        
        switch (entry.status) {
          case Status.Complete:
            return entry.value!;
            
          case Status.InProgress:
            return entry.placeholder!;
            
          case Status.NotStarted:
            entry.status = Status.InProgress;
            entry.placeholder = createPlaceholder(...args);
            
            const result = fn(...args);
            Object.assign(entry.placeholder, result);
            
            entry.status = Status.Complete;
            entry.value = entry.placeholder;
            
            return entry.placeholder;
        }
      }) as T;
    };
  }
  
  // Usage examples:
  // 
  // Basic string key:
  // const memoized = createAdvancedCyclicMemoization(
  //   (id) => id,
  //   () => ({ id: '', children: [] })
  // )(myTreeBuildingFunction);
  //
  // Multiple argument function:
  // const memoized = createAdvancedCyclicMemoization(
  //   (a, b, c) => `${a}-${b}-${c}`,
  //   () => new MyClass()
  // )(myFunction);
  //
  // Parameterized placeholder creation:
  // const memoized = createParameterizedCyclicMemoization(
  //   (id, rawData) => id,
  //   (id, rawData) => ({ id, raw: rawData, children: [] })
  // )(myTreeBuildingFunction);