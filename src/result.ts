export type Result<T> = SuccessResult<T> | FailureResult;

export class SuccessResult<T> {
	public readonly success = true;
	public readonly value: T;

	constructor(value: T) {
		this.value = value;
	}
}

export class FailureResult {
	public readonly success = false;
	public readonly error: Error;

	constructor(error: Error) {
		this.error = error;
	}
}

export const flattenResult =
	<Targs extends unknown[], Tout>(f: (...args: Targs) => Result<Tout>) =>
	(...args: Targs) => {
		const result = f(...args);
		if (!result.success) {
			throw result.error;
		}
		return result.value;
	};
