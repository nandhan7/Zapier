import { Router } from "express";
import { authMiddleware } from "../middleware";
import { SignupSchema, SigninSchema } from "../types";
import { NextFunction, Request, Response } from "express";
import { prismaClient } from "../db";
const express = require('express')
import jwt from "jsonwebtoken"
import { JWT_PASSWORD } from "../config";

const router = express.Router()

router.post("/signup", async (req: Request, res: Response) => {
    const body = req.body;
    const parsedData = SignupSchema.safeParse(body);

    if (!parsedData.success) {
        return res.status(411).json({ message: "Invalid Credentials" })
    }
    const userExists = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
        }
    })

    if (userExists) {
        return res.status(403).json({
            message: "User already exists"
        })
    }

    await prismaClient.user.create({
        data: {
            email: parsedData.data.username,
            password: parsedData.data.password,
            name: parsedData.data.name,
        }
    })
    //await SendEmail
    return res.json({
        message: "Please verify your account by checking your email"
    })


})
router.post("/signin", async (req: Request, res: Response) => {
    const body = req.body;
    const parsedData = SigninSchema.safeParse(body);

    if (!parsedData.success) {
        return res.status(411).json({ message: "Incorrect Inputs" })
    }

    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password
        }
    })

    if (!user) {
        return res.status(403).json({
            message: "User doesn't exists or Credentials are invalid"
        })
    }

    const token = jwt.sign({
        id: user.id
    }, JWT_PASSWORD)

    res.json({ token: token })


})

router.get("/", authMiddleware, async (req: Request, res: Response) => {
    //@ts-ignore
    const id = req.id;
    const user = await prismaClient.user.findFirst({
        where: {
            id
        },
        select: {
            name: true,
            email: true
        }

    })

    return res.json({
        user
    })

})

export const userRouter = router