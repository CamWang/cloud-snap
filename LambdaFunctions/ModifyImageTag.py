import boto3
import json

def get_target_item(items, item_key):
    for item in items:
        if item["key"]["S"] == item_key:
            target_item = item
            return target_item
        

def modify_item(modify_type, target_item, new_tag_list):
    if int(modify_type) == 1:
        for new_tag in new_tag_list:
            for old_tag in target_item["tags"]["L"]:
                if new_tag["tag"] == old_tag["M"]["tag"]["S"]:
                    if "count" in new_tag:
                        old_tag["M"]["count"]["N"] = str(int(old_tag["M"]["count"]["N"]) + int(new_tag["count"]))
                    else:
                        new_tag["count"] == 1
                        old_tag["M"]["count"]["N"] = str(int(old_tag["M"]["count"]["N"]) + 1)
                    return target_item
                else:


    
    if int(modify_type) == 0:
        updated_tag_list = []
        for old_tag in target_item["tags"]["L"]:
            for new_tag in new_tag_list:
                if new_tag["tag"] == old_tag["M"]["tag"]["S"]:
                    if int(old_tag["M"]["count"]["N"]) > int(new_tag["count"]):
                        old_tag["M"]["count"]["N"] = str(int(old_tag["M"]["count"]["N"]) - int(new_tag["count"]))
                    else:
                        old_tag["M"]["count"]["N"] = '0'

        for old_tag in target_item["tags"]["L"]:
            if int(old_tag["M"]["count"]["N"]) != 0:
                updated_tag_list.append(old_tag)
        
        target_item["tags"]["L"] = updated_tag_list
        return target_item


def lambda_handler(event, context):
    print(json.dumps(event))
    modify_image_key = event["key"]
    modify_type = event["type"]
    new_tag_list = event["tags"]


    dynamoDB = boto3.client("dynamodb")
    response = dynamoDB.scan(TableName = "image_tags")
    items = response["Items"]

    target_item = get_target_item(items, modify_image_key)
    new_item = modify_item(modify_type, target_item, new_tag_list)
    print(json.dumps(new_item))
    dynamoDB.put_item(
        TableName = "image_tags",
        Item = new_item
    )


