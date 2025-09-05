import { ICommentResponse } from "../../facebook.service.i"

export interface IGetCmtPublicResponse {
    hasData: boolean
    data?: ICommentResponse
}