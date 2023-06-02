import {
  Button,
  Card,
  InputNumber,
  Modal,
  Typography,
  message,
  Space,
  Input,
  
} from "antd";
import { TagDataType } from "./types";
import Meta from "antd/es/card/Meta";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Table, { ColumnsType } from "antd/es/table";
import { useState, useMemo, useEffect, useContext, useCallback } from "react";
import { Storage, API } from "aws-amplify";
import { ImagesContext } from "./context/ImagesContext";

const { Text } = Typography;

type ImageDataType = {
  key: string;
  url: string;
};
const apiName = "CloudSnap API";
const imagePath = "/image";

const UPDATE_INCREASE_TYPE = 1;
const UPDATE_DECREASE_TYPE = 0;

const getTagDataDifference = (
  tagData: TagDataType[],
  initalTagData: TagDataType[]
) => {
  const tagsHasMoreCount = tagData.filter(
    (item) =>
      item.count >
      (initalTagData?.find((tag: TagDataType) => tag.tag === item.tag)?.count ||
        0)
  );
  const tagsHasLessCount = tagData.filter(
    (item) =>
      item.count <
      (initalTagData?.find((tag: TagDataType) => tag.tag === item.tag)?.count ||
        0)
  );
  tagsHasMoreCount.forEach((item) => {
    item.count -= (initalTagData?.find((tag: TagDataType) => tag.tag === item.tag)?.count || 0);
  });
  tagsHasLessCount.forEach((item) => {
    item.count = (initalTagData?.find((tag: TagDataType) => tag.tag === item.tag)?.count || 0) - item.count;
  });
  return {
    tagsHasMoreCount,
    tagsHasLessCount,
  };
};

function Browse() {
  const [messageApi, contextHolder] = message.useMessage({ maxCount: 1,  top: 64, duration: 2});
  const [modelTableLoading, setModelTableLoading] = useState<boolean>(false);

  const [open, setOpen] = useState<boolean>(false);
  const showModal = useCallback((key: string) => {
    setModelTableLoading(true);
    setCurrentImage(key);
    API.get(apiName, imagePath, {
      queryStringParameters: {
        key: `public/${key}`,
      },
    })
      .then((response) => {
        if (!response.tags) {
          messageApi.open({
            type: "error",
            content: "Error loading image tags or image have no tags",
          });
          return;
        } else {
          setTagData(response.tags);
          setInitalTagData(response.tags);
        }
      })
      .catch((error) => {
        console.log(error.response);
      }).finally(() => {
        setModelTableLoading(false);
      });
    setOpen(true);
  }, [messageApi]);

  const hideModel = () => {
    setOpen(false);
  };

  const [tagData, setTagData] = useState<TagDataType[]>([]);
  const [initalTagData, setInitalTagData] = useState<TagDataType[]>([]);
  const [editTag, setEditTag] = useState<TagDataType | null>(null);

  const [tag, setTag] = useState<string>('');
  const [value, setValue] = useState<number>(1);

  const [currentImage, setCurrentImage] = useState<string>("");
  const [currentImages, setCurrentImages] = useState<ImageDataType[]>([]);

  const { images } = useContext(ImagesContext);

  const fetchImages = useCallback(async () => {
    let results;
    if (images.length > 0) {
      results = images;
    } else {
      try {
        const images = await Storage.list("");
        results = images.results.map((item) => item.key);
        messageApi.open({
          type: "info",
          content: "No tag filter specified, loading all images",
        });
      } catch (e) {
        messageApi.open({
          type: "error",
          content: "Failed to load images",
        });
      }
    }
    if (results) {
      const imagePromises = results.map(async (key) => {
        if (key) {
          const url = await Storage.get(key, { level: "public" });
          return {
            key: key,
            url: url,
          };
        }
        return null;
      });
  
      Promise.all(imagePromises).then((imageList) => {
        setCurrentImages(
          imageList.filter((image) => image !== null)
            ? (imageList.filter((image) => image !== null) as ImageDataType[])
            : []
        );
      });
    }
  }, [images, messageApi])

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const deleteImage = useCallback(
    (key: string) => {
      messageApi.open({
        type: "loading",
        content: `Delete image ${key}`,
      });
      API.del(apiName, imagePath, {
        body: {
          key: `public/${key}`,
        },
      })
        .then(() => {
          fetchImages();
          messageApi.open({
            type: "success",
            content: "Image deleted",
          });
        })
        .catch((error) => {
          console.log(error.response);
        });
    },
    [fetchImages, messageApi]
  );

  const submitChange = useCallback(() => {
    const diffTags = getTagDataDifference(tagData, initalTagData);
    console.log(diffTags);
    if (diffTags.tagsHasMoreCount.length > 0) {
      API.post(apiName, imagePath, {
        body: {
          key: `public/${currentImage}`,
          type: UPDATE_INCREASE_TYPE,
          tags: diffTags.tagsHasMoreCount,
        },
      })
        .then(() => {
          messageApi.open({
            type: "success",
            content: "Image tags updated",
          });
        })
        .catch((error) => {
          console.log(error.response);
        });
    }
    if (diffTags.tagsHasLessCount.length > 0) {
      API.post(apiName, imagePath, {
        body: {
          key: `public/${currentImage}`,
          type: UPDATE_DECREASE_TYPE,
          tags: diffTags.tagsHasLessCount,
        },
      })
        .then(() => {
          messageApi.open({
            type: "success",
            content: "Image tags updated",
          });
          showModal(currentImage);
        })
        .catch((error) => {
          console.log(error.response);
        });
    }
  }, [tagData, initalTagData, currentImage, messageApi, showModal]);

  const addTagData = () => {
    let fail = false;
    if (!tag || !value) {
      fail = true;
      messageApi.open({
        type: 'error',
        content: 'Please fill in the tag name and least amount',
      });
    }
    if (tagData.some((item) => item.tag == tag)) {
      fail = true;
      messageApi.open({
        type: 'error',
        content: 'Tag name already exists',
      });
    }
    if (!fail) {
      setTagData([...tagData, { tag: tag, count: value}]);
    }
  };

  const columns: ColumnsType<TagDataType> = useMemo(
    () => [
      {
        title: "Tag",
        dataIndex: "tag",
        key: "tag",
        render: (tag: string) => <span>{tag}</span>,
      },
      {
        title: "Count",
        dataIndex: "count",
        key: "count",
        render: (value: number, record: TagDataType) => {
          if (record.tag === editTag?.tag) {
            return (
              <InputNumber
                value={value}
                onChange={(value) => {
                  setEditTag({ ...editTag, count: value ? value : 1 });
                }}
              />
            );
          } else {
            return <span>{value}</span>;
          }
        },
      },
      {
        title: "Edit",
        dataIndex: "key",
        key: "key",
        render: (tag: string, record: TagDataType) => (
          <>
            <Button
              style={{ marginRight: 8 }}
              type="primary"
              danger
              onClick={() => {
                setTagData(tagData.map((item) => {
                  if (item.tag == tag) {
                    item = { ...item, count: 0 };
                    return item;
                  }
                  return item;
                }));
              }}
            >
              Delete
            </Button>
            {editTag?.tag === tag ? (
              <Button
                type="primary"
                onClick={() => {
                  setTagData(
                    tagData.map((item) => (item.tag === tag ? editTag : item))
                  );
                  setEditTag(null);
                }}
              >
                Save
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={() => {
                  setEditTag(record);
                }}
              >
                Edit
              </Button>
            )}
          </>
        ),
      },
    ],
    [tagData, editTag]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflowY: "scroll",
        height: "100%",
      }}
    >
      {contextHolder}
      <div
        className="grid"
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, 1fr)",
          gridGap: "10px",
          padding: "10px",
        }}
      >
        {currentImages.map((obj) => (
          <Card
            hoverable
            key={obj.key}
            style={{minHeight: 320, maxHeight: 450}}
            bodyStyle={{ backgroundColor: "#fff" }}
            cover={<img alt="example" src={obj.url} />}
            actions={[
              <EditOutlined
                key="edit"
                onClick={() => {
                  showModal(obj.key);
                }}
              />,
              <DeleteOutlined
              twoToneColor="#f44336"
                key="delete"
                onClick={() => {
                  deleteImage(obj.key);
                }}
              />,
            ]}
          >
            <Meta title={obj.key} />
          </Card>
        ))}
      </div>
      <Modal
        title={`Edit tags for ${currentImage}`}
        open={open}
        onOk={submitChange}
        onCancel={hideModel}
        style={{ display: "flex", flexDirection: "column" }}
        okText="Save"
        cancelText="Cancel"
      >
        <Table
          style={{ width: "100%", marginTop: 24 }}
          loading={modelTableLoading}
          columns={columns}
          dataSource={tagData.map((item) => {
            return { ...item, key: item.tag };
          })}
        />
        <Text style={{ marginTop: 12 }}>Add New Tag</Text>
        <Space.Compact style={{width: '100%', paddingBottom: 32, paddingTop: 12}}>
          <Input onChange={(e) => {
              setTag(e.target.value);
            }} style={{ width: '60%' }} placeholder='Tag Name' />
          <InputNumber style={{ width: '40%' }} min={1} max={20} defaultValue={1} onChange={(value: number | null) => {
            setValue(value?value:0);
          }} placeholder='Least Amount' />
          <Button type='primary' onClick={addTagData}>Add</Button>
        </Space.Compact>
      </Modal>
    </div>
  );
}

export default Browse;
