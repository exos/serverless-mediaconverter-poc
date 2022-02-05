
import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as videos from './videos.js'; 
import debugLib from 'debug';

const debug = debugLib('handler:api');

const {
    S3_UPLOAD_DIR,
    S3_MEDIA_DIR,
    S3_BUCKET,
} = process.env;

/**
 * Create an S3 client
 * @return {S3Client}
 */
const getS3Client = (() => {
    let s3Client = null;
    return () => {
        if (s3Client) {
            return s3Client;
        }
        s3Client = new S3Client();
        return s3Client;
    };
})();

/**
 * List saved videos
 * @param {object} event
 * @param {object} context
 * @return {object}
 */
export async function list(event, context) {
    debug('Get videos list get');

    const results = await videos.listAll();

    return {
        statusCode: 200,
        body: JSON.stringify({
            videos: results,
        }),
    };
}

/**
 * Get video 
 * @param {object} event
 * @param {object} context
 * @return {object}
 */
export async function get(event, context) {
    const uuid = event.pathParameters.uuid;

    debug('Get video ', uuid);
 
    const video = await videos.get(uuid);

    if (!video || video.status !== videos.STATUS_PROCESSED) {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: 'Video not found',
            }),
        };
    }

    const key = `${S3_MEDIA_DIR}/${video.uuid}.mp4`;

    const getCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
    });

    const url = await getSignedUrl(
        getS3Client(),
        getCommand,
        {
            expiresIn: 3600,

        } 
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            video: video,
            url,
        }),
    };
}

/**
 * Create video 
 * @param {object} event
 * @param {object} context
 * @return {object}
 */
export async function create(event, context) {
    debug('Create video');

    const video = await videos.create();
    const key = `${S3_UPLOAD_DIR}/${video.uuid}`;

    const putCommand = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
    });

    const url = await getSignedUrl(
        getS3Client(),
        putCommand,
        {
            expiresIn: 600,
        }
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            uploadUri: url,
        }),
    };
};
