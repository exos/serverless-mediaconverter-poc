
import {readFileSync} from 'fs';
import {URL} from 'url';
import path from 'path';
import {
    MediaConvertClient,
    DescribeEndpointsCommand,
    CreateJobCommand,
} from "@aws-sdk/client-mediaconvert";
import * as videos from './videos.js';
import debugLib from 'debug';

const debug = debugLib('handlers:s3');

const {
    MEDIA_CONVERTER_QUEUE,
    MEDIA_CONVERTER_ARN,
    S3_MEDIA_DIR,
    S3_BUCKET,
    AWS_REGION,
} = process.env;

/**
 * Create a (usable) MediaConvert client
 * @return {Promise<MediaConvertClient>}
 */
const getMediaConverterClient = (() => {
    let client;

    return async () => {
        if (!client) {
            client = Promise.resolve((async () => {
                debug(`Creating media client, obtaining endpoints`);

                const tmc = new MediaConvertClient({
                    region: AWS_REGION,
                });

                const data = await tmc.send(new DescribeEndpointsCommand({
                    MaxResults: 0,
                }));

                if (!data.Endpoints.length) {
                    throw new Error(`Not endpoints for Media Coverter`);
                }

                debug(`Use endpoint ${data.Endpoints[0].Url}`);

                return new MediaConvertClient({
                    endpoint: data.Endpoints[0].Url,
                });
            })());
        }

        return await client;
    };
})();

/**
 * Create a MediaConvert job params
 * you can custom the file media-job.json following this documentation:
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/MediaConvert.html#createJob-property
 * @param {string} input
 * @param {string} output
 * @return {object}
 */
const createMediaParams = (() => {
    const data = JSON.parse(
        readFileSync(new URL('./media-job.json', import.meta.url), 'utf8')
    );

    return (input, output) => {
        const params = {
            ...data,
            Queue: MEDIA_CONVERTER_ARN,
        };

        params.Settings.Inputs[0].FileInput = `${input}`;
        params.Settings.OutputGroups[0].OutputGroupSettings.FileGroupSettings = {
            ...params.Settings.OutputGroups[0].OutputGroupSettings.FileGroupSettings,
            Destination: `${output}`,
        };

        debug(`Use params `, JSON.stringify(params));
        return params;
    };
})();

/**
 * Save complete video transcoding status
 * @param {object} details
 * @return {Promise<void>}
 */
async function complete(details) {
    debug('Complete video transcoding', JSON.stringify(details));

    const outputFile = details
        .outputGroupDetails[0]
        .outputDetails[0]
        .outputFilePaths[0]
    ;

    const uuid = path.basename(outputFile).split('.')[0];

    debug(`Set video ${uuid} as complete`);
    await videos.setStatus(uuid, videos.STATUS_PROCESSED);
    debug(`Saved video status`);
}

/**
 * Save error video transcoding status
 * @param {object} details
 * @return {Promise<void>}
 */
async function error(details) {
    debug('Fail video transcoding');
    debug(JSON.stringify(details, null, 2));
}

/**
 * Save upload video status and create a MediaConvert job
 * @param {object} events
 * @param {object} context
 * @return {Promise<void>}
 */
export async function upload(events, context) {
    debug('Files uploaded to s3');

    const mcClient = await getMediaConverterClient();

    for (const record of events.Records) {
        const {key} = record.s3.object;
        const fileName = path.basename(key);

        debug(`Processing ${key} as ${fileName}`);
        const input = new URL(key, `s3://${record.s3.bucket.name}`);
        const output = new URL(
            `${S3_MEDIA_DIR}/${fileName}`,
            `s3://${S3_BUCKET}`
        );

        debug('Creating params');
        const params = createMediaParams(input, output);

        debug('Creating media converter job');
        const command = new CreateJobCommand(params);

        debug('Sending job petition');
        const response = await mcClient.send(command);

        debug('Job created',  JSON.stringify(response));

        await videos.setStatus(fileName, videos.STATUS_PROCESSING);

        debug(`Finish proccess ${fileName}`);
    }
}

/**
 * Save complete video transcoding status
 * @param {object} events
 * @param {object} context
 * @return {Promise<void>}
 */
export async function encoded(event, context) {
    const {detail} = event;

    debug(`Encoded ${detail.status} for ${detail.jobId}`);

    switch (detail.status) {
        case 'COMPLETE':
            return complete(detail);
            break;
        case 'ERROR':
            return error(detail);
            break;
        default:
            throw new Error(`Unhandled status: ${detail.status}`);
    }
};
