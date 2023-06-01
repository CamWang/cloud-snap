import boto3
import numpy as np
from urllib.parse import unquote_plus
import cv2
import base64

confthres = 0.1

dynamoDB = boto3.client("dynamodb")

labels = []

with open("/opt/coco.names", "r") as f:
    labels = [name.strip() for name in f.readlines()]

def do_prediction(image, net, LABELS):
    (H, W) = image.shape[:2]
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
    
def lambda_handler(event, context):
    nets = cv2.dnn.readNetFromDarknet("/opt/yolov3-tiny.cfg", "/opt/yolov3-tiny.weights")
    base64_image = event['image']
    
    # CRITICAL Remove the base64 header
    if "," in base64_image:
        base64_image = base64_image.split(",")[1]
    
    decoded_image = base64.b64decode(base64_image)
    numpy_arr = np.frombuffer(decoded_image, np.uint8)
    image = cv2.imdecode(numpy_arr, cv2.IMREAD_COLOR)
    
    label_count = do_prediction(image, nets, labels)
    response = dynamoDB.scan(TableName='image_tags')
    items = response['Items']
    keys = []
    for item in items:
        for tag in item['tags']['L']:
            for targetTag, count in label_count.items():
                if tag['M']['tag']['S'] == targetTag and tag['M']['count']['N'] >= str(count):
                    keys.append(item['key']['S'])
                    break
    
    return keys