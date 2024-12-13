
import { actionsRouter } from './router/actions';
import { triggerRouter } from './router/trigger';
import { userRouter } from './router/user';
import { zapRouter } from './router/zap';
import cors from 'cors';
const express = require('express');
const app = express()
app.use(express.json())
app.use(cors())
app.use("/api/v1/user", userRouter)
app.use("/api/v1/zap", zapRouter)
app.use("/api/v1/trigger", triggerRouter)
app.use("/api/v1/action", actionsRouter)

app.listen(3000)