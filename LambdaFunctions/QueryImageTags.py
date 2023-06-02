import boto3
from boto3.dynamodb.types import TypeDeserializer

def dynamodb_to_json(item):
    deserializer = TypeDeserializer()
    json_item = {k: deserializer.deserialize(v) for k, v in item.items()}
    return json_item

def lambda_handler(event, context):
    key = event['key'].replace('%2', '/')
    dynamoDB = boto3.client("dynamodb")
    response = dynamoDB.scan(TableName='image_tags')
    items = response['Items']
    for item in items:
        if item['key']['S'] == key:
            return dynamodb_to_json(item)
            
    return {}