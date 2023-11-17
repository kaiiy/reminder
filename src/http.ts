import { ProxyResult } from "aws-lambda";
import { StatusCodes } from "http-status-codes";

export const forbiddenResponse: ProxyResult = {
	statusCode: StatusCodes.FORBIDDEN,
	body: "",
};
export const OkResponse: ProxyResult = {
	statusCode: StatusCodes.OK,
	body: "",
};
export const InternalServerErrorResponse: ProxyResult = {
	statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
	body: "",
};
