import boto3


def lambda_handler(event, context):
    tags = event['tags']

    dynamoDB = boto3.client("dynamodb")
    response = dynamoDB.scan(TableName='image_tags')
    items = response['Items']

    result = []
    for item in items:
        # Check each tag in the item's tag list
        tag_present_count = 0
        for check_tag in tags:
            for tag in item['tags']['L']:
                if tag['M']['tag']['S'] == check_tag['tag'] and tag['M']['count']['N'] >= str(check_tag['count']):
                    tag_present_count += 1
                    
        if tag_present_count == len(tags):
            result.append({
                'key': item['key']['S'],
                'url': item['url']['S']
            })
    
    return result