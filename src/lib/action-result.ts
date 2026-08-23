export type ActionResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      message: string
    }

export type ActionMessageResult =
  | {
      success: true
      message: string
    }
  | {
      success: false
      message: string
    }
