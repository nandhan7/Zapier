import { PrismaClient } from "@prisma/client"
import { JsonObject } from "@prisma/client/runtime/library"
import { Kafka } from "kafkajs"
import { parse } from "./parser"
const prismaClient = new PrismaClient()
const TOPIC_NAME = "zap-events"


const kafka = new Kafka({
    clientId: 'outbox-processor',
    brokers: ['localhost:9092']
})


async function main() {
    const consumer = kafka.consumer({ groupId: 'main-worker' });
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC_NAME, fromBeginning: true })
    const producer = kafka.producer();
    await producer.connect()
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                partition,
                offset: message.offset,
                value: message.value.toString(),
            })
            if (!message.value?.toString()) {
                return;
            }
            const parsedValue = JSON.parse(message.value?.toString());
            const zapRunId = parsedValue.zapRunId;
            const stage = parsedValue.stage;

            const zapRunDetails = await prismaClient.zapRun.findFirst({
                where: {
                    id: zapRunId
                },
                include: {
                    zap: {
                        include: {
                            actions: {
                                include: {
                                    type: true
                                }
                            }
                        }
                    }
                }
            })

            const currentAction = zapRunDetails?.zap.actions.find(x => x.sortingOrder === stage)
            if (!currentAction) {
                console.log("Current action not found")
                return;
            }
            // #console.log(currentAction)
            const zapRunMetadata = zapRunDetails?.metadata;
            if (currentAction.type.id === "email") {

                const body = parse((currentAction.metadata as JsonObject)?.body as string, zapRunMetadata);
                const to = parse((currentAction.metadata as JsonObject)?.email as string, zapRunMetadata);
                console.log(`Sending out email to ${to} body is ${body}`)

            }
            if (currentAction.type.id === "sol") {

                const amount = parse((currentAction.metadata as JsonObject)?.amount as string, zapRunMetadata);
                const address = parse((currentAction.metadata as JsonObject)?.address as string, zapRunMetadata);
                console.log(`sending out SOL of ${amount} to address ${address} `)
            }


            await new Promise(r => setTimeout(r, 5000)) //Doing expensive offeration . 

            const lastStage = (zapRunDetails?.zap.actions?.length || 1) - 1;
            if (lastStage !== stage) {
                await producer.send({
                    topic: TOPIC_NAME,
                    messages: [{
                        value: JSON.stringify({
                            stage: stage + 1,
                            zapRunId
                        })
                    }]

                })
            }
            console.log("Processing Done")
            await consumer.commitOffsets([{
                topic: TOPIC_NAME,
                partition: partition,
                offset: (parseInt(message.offset) + 1).toString()
            }])
        },
    })
}
main()