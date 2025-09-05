import { ICommentResponse } from "../../facebook.service.i"

export interface IGetCmtPrivateResponse {
    hasData: boolean
    data?: ICommentResponse | null
}