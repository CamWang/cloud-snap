import boto3


def lambda_handler(event, context):
    #delete from dynamoDB
    dynamoDB = boto3.client("dynamoDB")
    table_name = "image_tags"
    table = dynamoDB.Table(table_name)
    partition_key_value = "image"
    sort_key_value = event["key"]
    key = {
        "partition": partition_key_value,
        "key": sort_key_value
    }
    table.delete_item(key = key)

    #delete from S3
    s3 = boto3.client("s3")
    bucket_name = "cloudsnap-images125153-cloudsnaps"
    object_key = event["key"]
    s3.delete_object(Bucket = bucket_name, Key = object_key)
    # yiwen 2.1

