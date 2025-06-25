export type Result<T> = Success<T> | Failure<T>;

export class Success<T> {
  public readonly ok = true;

  constructor(
    public readonly data: T,
    public readonly nextPageToken?: string
  ) {}

  map<U>(f: (data: T) => U): Result<U> {
    const result = f(this.data);
    return new Success(result, this.nextPageToken);
  }

  get(): T {
    return this.data;
  }
}

export class Failure<T> {
  public readonly ok = false;

  constructor(public readonly error: Error) {}

  map<U>(f: (data: T) => U): Result<U> {
    return this as unknown as Failure<U>;
  }

  get(): T {
    throw this.error;
  }
}

export function collectResponses<T>(responses: Result<T>[]): Result<T[]> {
  const data: T[] = [];

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (response.ok) {
      data.push(response.data);
    } else {
      return response as Failure<T[]>;
    }
  }

  return new Success(data);
}
