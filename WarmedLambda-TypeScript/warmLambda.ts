import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as serverless from "@pulumi/aws-serverless";

export class WarmLambda extends pulumi.ComponentResource {
    public lambda: aws.lambda.Function;
    public subscription: serverless.cloudwatch.CloudwatchEventSubscription;
    public eventRule: aws.cloudwatch.EventRule;

    constructor(name: string,
        options: aws.serverless.FunctionOptions,
        handler: aws.serverless.Handler,
        opts?: pulumi.ResourceOptions) {
        if (!name) {
            throw new Error("Missing required resource name");
        }
        if (!handler) {
            throw new Error("Missing required function handler");
        }
        super("samples:WarmLambda", name);

        const eventRule = new aws.cloudwatch.EventRule(`${name}-warming-rule`, 
            { scheduleExpression: "rate(5 minutes)" },
            { parent: this, ...opts }
        );

        const outerHandler = (event: any, context: aws.serverless.Context, callback: (error: any, result: any) => void) =>
        {
            if (event.resources && event.resources[0] && event.resources[0].includes(eventRule.name.get())) {
                console.log('Warming...');
                callback(null, "warmed!");
            } else {
                console.log('Running the real handler...');
                handler(event, context, callback);
            }
        };

        const func = new aws.serverless.Function(
            `${name}-warmed`, 
            options, 
            outerHandler, 
            { parent: this, ...opts });
        this.lambda = func.lambda;            

        this.eventRule = eventRule;
        this.subscription = new serverless.cloudwatch.CloudwatchEventSubscription(
            `${name}-warming-subscription`, 
            this.eventRule,
            this.lambda,
            { },
            { parent: this, ...opts });
    }
}
