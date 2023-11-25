import { flattenResult } from "./result";
import { parseNumber, ptimeToIsoDuration } from "./time";

describe("parseNumber", () => {
	it("should return number", () => {
		const wrapper = flattenResult(parseNumber);
		expect(wrapper("1")).toBe(1);

		expect(() => wrapper("3.14")).toThrow();
		expect(() => wrapper("2e5")).toThrow();
		expect(() => wrapper("1h")).toThrow();
		expect(() => wrapper("")).toThrow();
		expect(() => wrapper("abc")).toThrow();
		expect(() => wrapper("1H")).toThrow();
		expect(() => wrapper("2E5")).toThrow();
		expect(() => wrapper(" 1 ")).toThrow();
		expect(() => wrapper(" 3.14 ")).toThrow();
	});
});

describe("ptimeToIsoDuration", () => {
	it("should return ISO duration", () => {
		const wrapper = flattenResult(ptimeToIsoDuration);
		expect(wrapper("+6h")).toBe("P0Y0M0DT6H0M0S");
		expect(wrapper("+0h")).toBe("P0Y0M0DT0H0M0S");

		expect(() => wrapper("+1d2h")).toThrow();
		expect(() => wrapper("1h")).toThrow();
		expect(() => wrapper("+1h2")).toThrow();
		expect(() => wrapper("+1h2d")).toThrow();
	});
});
