const AWS = require('aws-sdk');
const crypto = require('crypto');
const WinstonCloudWatch = require('winston-cloudwatch');
const ParseServer = require('parse-server');

AWS.config.update({
  region: process.env.S3_REGION,
});

// This is only set on local debugging. We don't want these logs going to CloudWatch
// Well, maybe we do, and we could use a different log stream name (or group name).
const isDevelopment = process.env.APP_ENV === 'development';

// An IAM user with the following policies allowed must be created. That user must be used for the logger.
/**
  'logs:CreateLogGroup',
  'logs:DescribeLogGroups';
  'logs:DescribeSubscriptionFilters',
  'logs:PutSubscriptionFilter',
  'logs:DeleteSubscriptionFilter',
  'logs:DescribeLogStreams',
  'logs:FilterLogEvents',
  'logs:GetLogEvents',
  'logs:GetQueryResults',
  'logs:StartQuery',
  'logs:StopQuery';
 */

// The following environment variables must be created:
/**
  LOGGER_AWS_REGION=
  LOGGER_AWS_ACCESS_KEY_ID=
  LOGGER_AWS_SECRET_KEY_ID=
*/

// Use a randomized (time-based) hash to append to our stream name
// so multiple instances of the server running don't log to the same
// date-separated stream.
const startTime = new Date().toISOString();
const serverHash = crypto.createHash('md5').update(startTime).digest('hex');

let cloudwatchLogger = null;

function getLogStreamName() {
  // Spread log streams across date & hour while the server runs
  const date = new Date();
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);

  const dateTime = date.toISOString().replace(/:/ig, '-').replace('.000', '');
  return `your-app-name-api/${dateTime}/[$${serverHash}]`;
}

function flushCloudwatchLogger() {
  cloudwatchLogger && cloudwatchLogger.kthxbye();
}

// This function must be called after the ParseServer constructor.
// https://github.com/parse-community/parse-server/blob/master/src/ParseServer.js#L73
function initCloudwatchLogger() {
  if (cloudwatchLogger || isDevelopment) {
    return;
  }

  // 'logger' is an instance of LoggerController.
  // If at some point they change that we could use ParseServer.config.loggerController instead
  const logger = ParseServer.logger;
  const winstonLoggerAdapter = logger.adapter;

  // Uncomment this to see all the activity from WinstonCloudWatch (or set it in the env)
  // process.env.WINSTON_CLOUDWATCH_DEBUG = true;

  // All options are here:
  // https://github.com/lazywithclass/winston-cloudwatch
  cloudwatchLogger = new WinstonCloudWatch({
    level: 'info', // defaults to 'info'
    name: 'parse-server-cloudwatch-logger',
    logGroupName: 'rehabguru-parse-server',
    logStreamName: getLogStreamName,
    awsRegion: process.env.LOGGER_AWS_REGION,
    awsAccessKeyId: process.env.LOGGER_AWS_ACCESS_KEY_ID,
    awsSecretKey: process.env.LOGGER_AWS_SECRET_KEY_ID,
    jsonMessage: true,
    retentionInDays: 7,
  });

  winstonLoggerAdapter.addTransport(cloudwatchLogger);

  // You can manually capture errors like this:
  // require('parse-server').logger.error('This is a test error');
  // equivalent to
  // require('parse-server').logger.log('error', 'This is a test error');
  // and the same for all other log levels.
}

module.exports = {
  initCloudwatchLogger,
  flushCloudwatchLogger,
};
