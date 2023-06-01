import json
import os
import boto3


def lambda_handler(event, context):
    tags = event["tags"]
    #print(f"tags={tags}")

    dynamoDB = boto3.client("dynamoDB")
    table_name = "image_tags"
    condition_expression = ' AND '.join(['tags.M.#{}.#N >= :{}'.format(tag['tag'], tag['count']) for tag in tags])
    expression_attribute_names = {'#{}'.format(tag['tag']): tag['tag'] for tag in tags}
    expression_attribute_values = {':{}'.format(tag['count']): {'N': str(tag['count'])} for tag in tags}

    response = dynamoDB.scan(
    TableName=table_name,
    FilterExpression=condition_expression,
    ExpressionAttributeNames=expression_attribute_names,
    ExpressionAttributeValues=expression_attribute_values
    )

    urls = []
    items = response["Items"]
    for item in items:
        url = item["url"]["S"]
        urls.append(url)
    
    print(f"urls = urls")


    




