
import fs from 'fs';
import {program} from 'commander';
import fetch from 'node-fetch';
import debugLib from 'debug';

const debug = debugLib('vmc:tools');

program
    .command('upload <apiurl> <file>')
    .action(async (apiurl, file) => {
        debug(`Send post to ${apiurl}`);
        const response = await fetch(apiurl, {method: 'POST'});

        if (response.status !== 200) {
            throw new Error(`Error: ${response.status}`);
            return;
        }

        const {uploadUri} = await response.json();

        const data = fs.createReadStream(file);
        const dataLength = fs.statSync(file).size;

        debug(`Uploading ${file} to ${uploadUri}`);

        const responseUpload = await fetch(
            uploadUri,
            {
                method: 'PUT',
                body: data,
                headers: {
                    'Content-Length': dataLength,
                },
            }
        );


        /*        if (responseUpload.status !== 200) {
            throw new Error(`Error: ${responseUpload.status}`);
            return;
        }*/

        return;
    })
;

(async () => program.parseAsync(process.argv))()
    .then(() => {
        console.log('done');
        process.exit(0);
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
;
