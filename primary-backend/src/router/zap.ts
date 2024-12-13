import { Request, Response, Router } from "express";
import { authMiddleware } from "../middleware";
import { ZapCreateSchema } from "../types";
import { prismaClient } from "../db";
const express = require('express')

const router = express.Router()


router.post("/", authMiddleware, async (req: Request, res: Response) => {
    //@ts-ignore
    const id: string = req.id;
    const body = req.body;
    const parsedData = ZapCreateSchema.safeParse(body);
    console.log(body);
    if (!parsedData.success) {
        return res.status(411).json({
            message: "Incorrect inputs",
            errors: parsedData.error.errors

        })
    }
    const zapId = await prismaClient.$transaction(async tx => {
        const zap = await tx.zap.create({
            data: {
                userId: parseInt(id),
                triggerId: "",
                actions: {
                    create: parsedData.data.actions.map((x, index) => ({
                        actionId: x.availableActionId,
                        sortingOrder: index,
                        metadata:x.actionMetadata
                    }))
                }
            }
        })


        const trigger = await tx.trigger.create({
            data: {
                triggerId: parsedData.data.availableTriggerId,
                zapId: zap.id
            }
        })

        await tx.zap.update({
            where: {
                id: zap.id,
            }, data: {
                triggerId: trigger.id
            }
        })
        return zap.id;
    })

    res.json({
        zapId
    })


})
router.get("/", authMiddleware, async (req: Request, res: Response) => {
    //@ts-ignore
    const id = req.id;
    const zaps = await prismaClient.zap.findMany({
        where: {
            userId: id
        },
        include: {
            actions: {
                include: {
                    type: true
                }
            },
            trigger: {
                include: {
                    type: true
                }
            }
        }
    })
    return res.json({
        zaps
    })

})
router.get("/:zapId", authMiddleware, async (req: Request, res: Response) => {
    //@ts-ignore
    const id = req.id;
    const zapId = req.params.zapId;
    const zap = await prismaClient.zap.findFirst({
        where: {
            id: zapId,
            userId: id
        },
        include: {
            actions: {
                include: {
                    type: true
                }
            },
            trigger: {
                include: {
                    type: true
                }
            }
        }
    })
    return res.json({
        zap
    })
})


export const zapRouter = router