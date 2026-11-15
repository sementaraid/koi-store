// Only the multer surface src/api/middlewares.ts uses. The owner approved
// `multer` without `@types/multer`, so it is typed here instead of left `any`.
declare module "multer" {
  import type { NextFunction, Request, Response } from "express"

  type File = { fieldname: string; originalname: string; mimetype: string; size: number; buffer: Buffer }
  type Handler = (req: Request, res: Response, next: NextFunction) => void
  type Options = {
    storage?: unknown
    limits?: { fileSize?: number; files?: number; fields?: number }
    fileFilter?: (req: Request, file: File, cb: (error: Error | null, accept?: boolean) => void) => void
  }

  function multer(options?: Options): { single(field: string): Handler }
  namespace multer {
    function memoryStorage(): unknown
    class MulterError extends Error {
      code: string
    }
  }
  export default multer
}
