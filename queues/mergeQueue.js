import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { mergeInfo } from '../controllers/mergeInfo.js';
import { mergeLogic } from '../controllers/mergeLogic.js';
import dotenv from 'dotenv';
dotenv.config();

const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    maxRetriesPerRequest: null
});

export const mergeQueue = new Queue('merge-contacts', { connection });

const worker = new Worker('merge-contacts', async (job) => {
    console.log(`Processing job ${job.id}:`, job.data);

    const { searchResult } = job.data;

    const mergedInfo = await mergeInfo(searchResult);
    const logicResult = await mergeLogic(mergedInfo);

    console.log('Logic Result:', logicResult);

    return logicResult;
}, {
    connection,
    limiter: {
        max: 1,
        duration: 2000
    }
});

worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed with result:`, result);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});