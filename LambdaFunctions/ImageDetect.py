import boto3
import base64
from botocore.exceptions import NoCredentialsError
import numpy as np
import sys
import time
import cv2
import os
import json

confthres = 0.3
nmsthres = 0.1


def get_labels(labels_path):
    label = labels_path["Body"].read().decode("utf-8").strip().split("\n")
    return label


def get_weights(weights_path):
    weights_path = weights_path["Body"].read()
    return weights_path


def get_config(config_path):
    config = config_path["Body"].read()
    return config


def load_model(config_path, weights_path):
    print("[INFO] loading YOLO from disk...")
    net = cv2.dnn.readNetFromDarknet(config_path, weights_path)
    return net


def do_prediction(image, net, LABELS, response):
    (H, W) = image.shape[:2]
    # determine only the *output* layer names that we need from YOLO
    ln = net.getLayerNames()
    ln = [ln[i - 1] for i in net.getUnconnectedOutLayers()]

    # construct a blob from the input image and then perform a forward
    # pass of the YOLO object detector, giving us our bounding boxes and
    # associated probabilities
    blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416),
                                 swapRB=True, crop=False)
    net.setInput(blob)
    start = time.time()
    layerOutputs = net.forward(ln)
    # print(layerOutputs)
    end = time.time()

    # show timing information on YOLO
    print("[INFO] YOLO took {:.6f} seconds".format(end - start))

    # initialize our lists of detected bounding boxes, confidences, and
    # class IDs, respectively
    boxes = []
    confidences = []
    classIDs = []

    # loop over each of the layer outputs
    for output in layerOutputs:
        # loop over each of the detections
        for detection in output:
            # extract the class ID and confidence (i.e., probability) of
            # the current object detection
            scores = detection[5:]
            # print(scores)
            classID = np.argmax(scores)
            # print(classID)
            confidence = scores[classID]

            # filter out weak predictions by ensuring the detected
            # probability is greater than the minimum probability
            if confidence > confthres:
                # scale the bounding box coordinates back relative to the
                # size of the image, keeping in mind that YOLO actually
                # returns the center (x, y)-coordinates of the bounding
                # box followed by the boxes' width and height
                box = detection[0:4] * np.array([W, H, W, H])
                (centerX, centerY, width, height) = box.astype("int")

                # use the center (x, y)-coordinates to derive the top and
                # and left corner of the bounding box
                x = int(centerX - (width / 2))
                y = int(centerY - (height / 2))

                # update our list of bounding box coordinates, confidences,
                # and class IDs
                boxes.append([x, y, int(width), int(height)])

                confidences.append(float(confidence))
                classIDs.append(classID)

    # apply non-maxima suppression to suppress weak, overlapping bounding boxes
    idxs = cv2.dnn.NMSBoxes(boxes, confidences, confthres, nmsthres)
    labels = []
    if len(idxs) > 0:
        for i in idxs.flatten():
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


def process_image(image):
    image = np.frombuffer(image, np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)  # use cv2 method to process the image
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return image

def insert_detect_result_to_DB(label_count, image_url):
    dynamoDB = boto3.resource("dynamoDB")
    table_name = "image_tags"
    table = dynamoDB.Table(table_name)
    table.put_item(
        Item={
            "partition": "image",
            "tags": label_count,
            "url": image_url
        }
    )
    
def lambda_handler(event, context):
    s3_client = boto3.client("s3")
    label_path = s3_client.get_object(
        Bucket="yolo-config-bucket-group23",
        key="coco.names"
    )
    config_path = s3_client.get_object(
        Bucket="yolo-config-bucket-group23",
        key="yolov3-tiny.cfg"
    )
    weight_path = s3_client.get_object(
        Bucket="yolo-config-bucket-group23",
        key="yolov3-tiny.weights"
    )
    Lables = get_labels(label_path)
    CFG = get_config(config_path)
    Weights = get_weights(weight_path)
    nets = load_model(CFG, Weights)
    try:
        #TODO: RETRIEVE IMAGE FROM EVENT
        #image = ?
        image = base64.b64decode(event["body"]["image"])
        image = process_image(image)
        response = f"{event['body']['filename']}"
        label_count = do_prediction(image, nets, Lables, response)
        #TODO:RETRIEVE URL FROM EVENT
        #image_url = ?
        insert_detect_result_to_DB(label_count, image_url)

    except Exception as e:
        print("Exception  {}".format(e))
        return {
            "statusCode": 500,
            "body": "Internal server error"
        }