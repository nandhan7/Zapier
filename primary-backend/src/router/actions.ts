import { Router } from "express";
import { authMiddleware } from "../middleware";
import { SignupSchema, SigninSchema } from "../types";
import { NextFunction, Request, Response } from "express";
import { prismaClient } from "../db";
const express = require('express')
import jwt from "jsonwebtoken"
import { JWT_PASSWORD } from "../config";

const router = express.Router()

router.get("/available", async (req: Request, res: Response) => {
    const availableActions = await prismaClient.availableAction.findMany({})
    res.json({ availableActions })
})

export const actionsRouter = router