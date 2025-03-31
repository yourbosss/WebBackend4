import { Request, Response, NextFunction } from "express";

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`Ошибка: ${err.message}`);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: err.message || "Внутренняя ошибка сервера",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}