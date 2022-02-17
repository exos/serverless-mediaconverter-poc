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

## License 📄

@TODO
