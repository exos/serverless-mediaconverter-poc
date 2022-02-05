
import {v4 as uuidv4} from 'uuid';
import {
    DynamoDBClient,
    ScanCommand,
    GetItemCommand,
    QueryCommand,
    PutItemCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import debugLib from 'debug';

const debug = debugLib('videos');

const DB_TABLE = process.env.DB_TABLE;

const client = new DynamoDBClient();

export const STATUS_NEW = 0x00;
export const STATUS_PROCESSING = 0x01;
export const STATUS_PROCESSED = 0x02;
export const STATUS_ERROR = 0x03;

/**
 * Parse video item from DynamoDB response
 * @param {object} item
 * @returns {object}
 */
const parseVideoItem = (item) => ({
    uuid: item.uuid.S,
    status: parseInt(item.status.N, 10),
});

/**
 * List all videos from db
 * @returns {Promise<object[]>}
 */
export async function listAll() {
    debug('Listing all videos');
    const result = await client.send(new ScanCommand({
        TableName: DB_TABLE,
        AttributesToGet: ['uuid', 'status'],
        Limit: 10
    }));

    return result.Items.map(parseVideoItem);
}

/**
 * List videos from db by status
 * @param {number} status
 * @returns {Promise<object>}
 */
export async function listByStatus(status) {
    debug(`Listing videos with status ${status}`);
    const result = await client.send(new QueryCommand({
        TableName: DB_TABLE,
        KeyConditionExpression: 'status = :status',
        ExpressionAttributeValues: {
            ':status': `${status}`,
        },
    }));

    return result.Items.map(parseVideoItem);
}

/**
 * Get video by uuid
 * @param {string} uuid
 * @returns {Promise<object|null>}
 */
export async function get(uuid) {
    debug(`Getting video with uuid ${uuid}`);
    const result = await client.send(new GetItemCommand({
        TableName: DB_TABLE,
        Key: {
            uuid: {S: uuid}
        },
    }));

    debug('Result', result);

    if (!result.Item) {
        return null;
    }

    return parseVideoItem(result.Item);
}

/**
 * Create new video
 * @returns {Promise<object>}
 */
export async function create() {
    debug('Creating new video');
    const data = {
        uuid: {S: uuidv4()},
        status: {N: `${STATUS_NEW}`},
    };

    await client.send(new PutItemCommand({
        TableName: DB_TABLE,
        Item: data,
    }));

    return parseVideoItem(data);
}

/**
 * Set status of video
 * @param {string} uuid
 * @param {number} status
 * @returns {Promise<object>}
 */
export async function setStatus(uuid, status) {
    debug(`Setting status of video with uuid ${uuid} to ${status}`);
    return client.send(new UpdateItemCommand({
        TableName: DB_TABLE,
        Key: {
            uuid: {S: uuid}
        },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: {
            '#status': 'status'
        },
        ExpressionAttributeValues: {
            ':status': {N: status.toString()}
        }
    }));
}
