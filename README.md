# Parse Server CloudWatch Logger
Extension to Parse Servers Winston Logger to send logs to AWS CloudWatch

### Instructions
1. Add `parse-cloudwatchlogger.js` to your project root
2. Add the following to the Parse Server `index.js` file

```
const { initCloudwatchLogger } = require('./cloud/parse-cloudwatchlogger'); <-- import custom logger at top of file


const api = new ParseServer({
...ParseServerOptions
jsonLogs: true,  <-- set logging to JSON
logLevel: 'info' <-- choose log level ('verbose', 'info', 'warn', 'error'). 

```

3. Setup a user on IAM using the following policies:

```
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
  ```
  
  4. Add env vars. 
  5. Navigate to AWS CloudWatch to see if logs are being run. Be mindfull of doing this in local dev as it will create a stream for each server re-load which can get large if you are developing locally. 
