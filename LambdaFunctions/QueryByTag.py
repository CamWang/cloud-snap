import boto3


def lambda_handler(event, context):
    tags = event['tags']

    dynamoDB = boto3.client("dynamodb")
    response = dynamoDB.scan(TableName='image_tags')
    items = response['Items']

    keys = []
    for item in items:
        # Check each tag in the item's tag list
        for tag in item['tags']['L']:
            for check_tag in tags:
                if tag['M']['tag']['S'] == check_tag['tag'] and tag['M']['count']['N'] >= str(check_tag['count']):
                    keys.append(item['key']['S'])
                    break  # This will break the innermost loop, moving to the next item
    
    print(f"keys = {keys}")
    return keys
