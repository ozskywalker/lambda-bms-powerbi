# lambda-bms-powerbi
Exploratory serverless app for streaming data from Kaseya BMS into Microsoft Power BI

This function will run every 15 minutes, pulling the latest ticket summary data and sending it into a streaming dataset in PowerBI.

This code is provided with no warranty or support, and is supplied as under the MIT License.

I apologize in advance for my horrible Promise nest.

## Prerequisites

You will need the Serverless Framework deployed on your local development machine.  
Go to https://serverless.com/ for the latest version.

If you wish your streaming data to be preserved, make sure you enable the "Historic data analysis" option when creating the streaming dataset to ensure the dataset becomes both a streaming dataset, and a push dataset.

For more information on streaming data sets, and creating a streaming dataset via the UI, please refer to Microsoft PowerBI documentation here: https://docs.microsoft.com/en-us/power-bi/service-real-time-streaming

## Deployment

1. Create a streaming dataset in Power BI.   You will need to set the following "values from stream":
 AccountName, DueDate, LastActivityUpdate, OpenDate, Queue, Status, TicketNumber, Title
2. Clone the repo to your local development machine
3. Create env.yml and set the following environment variables:

```
POWERBI_API = (Mandatory) URL for the Streaming dataset in PowerBI
BMS_API_USERNAME = (Mandatory) Username to access BMS
BMS_API_PASSWORD = (Mandatory) Password to access BMS
BMS_API_TENANT = (Mandatory) The Company name, or name of your instance
BMS_API_SERVER = Optional URL for BMS.  By default, this will be set to https://bms.kaseya.com, but you will need to set to https://bmsemea.kaseya.com if your instance is deployed in EMEA.
BMS_API_TOP = Optional control over the number of results to pull.  Set to 15 by default
```

4. Deploy by running *serverless deploy*

Sample output:
```
$ serverless deploy
Serverless: Packaging service...
Serverless: Excluding development dependencies...
Serverless: Creating Stack...
Serverless: Checking Stack create progress...
.....
Serverless: Stack create finished...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading artifacts...
Serverless: Uploading service .zip file to S3 (6.79 KB)...
Serverless: Validating template...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
.................
Serverless: Stack update finished...
Service Information
service: streaming-bms
stage: prod
region: us-east-1
stack: streaming-bms-prod
api keys:
  None
endpoints:
  None
functions:
  getBMStickets: streaming-bms-prod-getBMStickets
layers:
  None
```

## Uninstall

You can uninstall the stack by running *serverless remove*.

Sample output:
```
$ serverless remove
Serverless: Getting all objects in S3 bucket...
Serverless: Removing objects in S3 bucket...
Serverless: Removing Stack...
Serverless: Checking Stack removal progress...
.......
Serverless: Stack removal finished...
```

## TODO

* Use OData expression to grab latest tickets based on creation date.  Right now we use top=15 (default) just to get some data across, but we should be able to do this off something like $filter=CreatedOn ge DateTime'yyyy-mm-ddT00:00:00'
* Add error handling
* Clean-up the promise mess
* Pass metrics back to track success & no. of records passed along 
* Add code to ensure we're not running away (concurrent execution of task).  While PowerBI will filter out duplicates, unnecessary executions because someone's accidentally triggered the function (misconfigured to run every 1min, etc.) should be caught here.

## Contributions

Pull requests are welcomed - while this is an experiment, if you make changes and would like to contribute back, please do :)
