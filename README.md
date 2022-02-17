# 100% Serverless Video Transcoding solution

Serverless project to upload videos and transcode it on AWS.

**DON'T USE THIS IN PRODUCTION**

This code is only for learning reasons, or based on it for develop your
solution.

## How works ⚙️

We are going to use a few services from AWS to automatize the encoding of
upload videos, using H264 and resicing to 720px.

![diagram](docs/diagram.png)

### Resources used

The list of resources if available in the file `infra/resources.yaml` and there
are:

* Media Converter Queue
* Media Converter Role
* DynamoDB Table
* S3 Bucket
* Lambda functions
* Api gateway

## Getting Started 🚀

### Prerequisites 📋

* Node
* AWS account

### Get sources 🔧

Clone git repo:

```
$ git clone @TODO
```

### Deploy 📦

You need a valid AWS account and the credentials configured in the CLI.

#### Install dependencies:

```
$ npm install
```

Or Yarn

```
$ yarn
```

You can to install the tool's dependencies:

```
$ cd tools
$ npm install
```

#### Custom your config

Open the `infra/custom.yaml` file to change names and other configurations.

#### Set project prefix

Amazon names are uniqe, by default the names are conformed by a prefix, a name
for the resource and the stage (by default is dev), for example:

```yaml
bucketName: ${self:custom.prefix}-uploads-${self:custom.stage}
```

Is important than you set a prefix param in `infra/custom.yaml` to avoid errors
like "The resource exists".

#### Deploy stack

You need to run:

```
$ npx sls deploy
```

And the magic appears.

## Try it 

When you finish to deploy this stack, you must to get something like:

```
Deploying mytest-media-converter to stage dev (us-east-1)
✔ Pruning of functions complete

✔ Service deployed to stack mytest-media-converter-dev (141s)

endpoints:
  GET - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/videos
  GET - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/videos/{uuid}
  POST - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/videos
functions:
  ListVideos: mytest-media-converter-dev-ListVideos (4 MB)
  GetVideoUri: mytest-media-converter-dev-GetVideoUri (4 MB)
  CreateVideo: mytest-media-converter-dev-CreateVideo (4 MB)
  SetUpload: mytest-media-converter-dev-SetUpload (4 MB)
  SetEncoded: mytest-media-converter-dev-SetEncoded (4 MB)
```

Those endpoints urls are public, you can to try it with curl or software like
postman:

```
$ curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/videos
```

This endpoint return a list of json object, with video uuid and status.

### Status

The status of contents refer to:

|Value|Name|Description|
|:--:|:---:|:--|
|0|NEW|The video has created in the DB, but the convertion job don't start yet|
|1|PROCESSING|Media Converter job has started, the video is transcoding|
|2|PROCESSED|Media Converter job is finished and is success|
|3|ERROR|Media Converter job fails converting video|

### Uploading test video

When you create a video record this return an upload URL directly with Amazon
S3, you need to upload the video sending a `PUT` to this URL, for simplify the
process of upload, there are a script to test it in `tools/index.js`, you can
run it with:

```
$ DEBUG="vmc*" node tools/index.js upload https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/videos /path/to/original.video
```

> `DEBUG="vmc*"` shows debug info (steps and responses)

The only method now is `upload`, you can see the usage with:

```
$ node tools/index.js --help
$ node tools/index.js upload --help
```

## License 📄

@TODO
