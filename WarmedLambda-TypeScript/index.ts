import * as aws from "@pulumi/aws";
import * as serverless from "@pulumi/aws-serverless";
import {WarmLambda} from "./warmLambda";

const policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com",
            },
            "Effect": "Allow",
            "Sid": "",
        }
    ],
};
const role = new aws.iam.Role("warmrole", {
    assumeRolePolicy: JSON.stringify(policy)
});

let fullAccess = new aws.iam.RolePolicyAttachment("warmrole-access", {
    role: role,
    policyArn: aws.iam.AWSLambdaFullAccess,
});


const handler = (event: any, context: any, callback: (error: any, result: any) => void) => {
    const response = {
        statusCode: 200,
        body: "I will keep warm (well, most of the time)"
      };
    
    callback(null, response);
};

//const lambda = new aws.serverless.Function("myfunction", { role: role }, handler);

const imwarm = new WarmLambda("i-am-warm", { role: role }, handler);

const api = new serverless.apigateway.API("api", {
    routes: [{ method: "GET", path: `/`, handler: imwarm.lambda }]
});

export const url = api.url;