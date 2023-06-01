import boto3
import base64
from botocore.exceptions import NoCredentialsError
import numpy as np
from urllib.parse import unquote_plus
import cv2
import uuid

confthres = 0.3

s3 = boto3.client("s3")
dynamoDB = boto3.resource("dynamodb")
labels = []

with open("/opt/coco.names", "r") as f:
    labels = [name.strip() for name in f.readlines()]

def do_prediction(image, net, LABELS):
    (H, W) = image.shape[:2]
    print(H, W)
    ln = net.getLayerNames()
    layers = [ln[i - 1] for i in net.getUnconnectedOutLayers()]
    blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416),
                                 swapRB=True, crop=False)
    net.setInput(blob)
    layerOutputs = net.forward(layers)

    classIDs = []

    for output in layerOutputs:
        for detection in output:
            scores = detection[5:]
            classID = np.argmax(scores)
            confidence = scores[classID]
            if confidence > confthres:
                classIDs.append(classID)

    labels = []
    for i in range(len(classIDs)):
        labels.append(LABELS[classIDs[i]])
            
    print(labels)
    label_count = count_label(labels)
    return label_count


def count_label(labels):
    label_count = {}
    for label in labels:
        if label not in list(label_count.keys()):
            label_count[label] = 1
        else:
            label_count[label] += 1
    return label_count


def process_image(image):
    image = np.frombuffer(image, np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return image

def query_by_tags(label_count):
    tags = label_count

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

    #print(f"urls = {urls}")

    return urls
    
    
    
def lambda_handler(event, context):
    nets = cv2.dnn.readNetFromDarknet("/opt/yolov3-tiny.cfg", "/opt/yolov3-tiny.weights")
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8').replace(' ', '/')
    url = f"https://{bucket}.s3.amazonaws.com/{key}"
    print(key)
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        image = response['Body'].read()
        image = process_image(image)
        label_count = do_prediction(image, nets, labels)
        urls = query_by_tags(label_count)
        #print("label_count: ", label_count)
    except Exception as e:
        print(e)
    
