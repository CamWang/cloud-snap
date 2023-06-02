import { Button, Card, Input, InputNumber, Modal, Space, Typography, message } from 'antd'
import { TagDataType } from './types';
import Meta from 'antd/es/card/Meta';
import { EditOutlined } from '@ant-design/icons';
import Table, { ColumnsType } from 'antd/es/table';
import { useState, useMemo, useEffect, useContext } from 'react';
import { Storage } from 'aws-amplify';
import { ImagesContext } from './context/ImagesContext';

const {Text} = Typography;

type ImageDataType = {
  key: string;
  url: string;
}

function Browse() {
  const [messageApi, contextHolder] = message.useMessage({maxCount: 1});

  const [open, setOpen] = useState<boolean>(false);
  const showModal = () => {
    setOpen(true)
  };
  const hideModel = () => setOpen(false);

  const [tagData, setTagData] = useState<TagDataType[]>([]);
  const [editTag, setEditTag] = useState<TagDataType | null>(null);

  const [tag, setTag] = useState<string>('');
  const [value, setValue] = useState<number>(1);

  const [currentImages, setCurrentImages] = useState<ImageDataType[]>([]);

  const {images} = useContext(ImagesContext);

  const fetchImages = (results: (string | undefined)[]) => {
    console.log(results)
    const imagePromises = results.map(async (key) => {
      if (key) {
        const url = await Storage.get(key, { level: 'public' });
        return {
          key: key,
          url: url,
        };
      }
      return null;
    });

    Promise.all(imagePromises)
      .then((imageList) => {
        setCurrentImages(imageList.filter(image => image !== null) ? imageList.filter(image => image !== null) as ImageDataType[] : []);
      });
  }
  
  useEffect(() => {
    if (images.length > 0) {
      fetchImages(images);
    } else {
      Storage.list('')
      .then(({ results }) => {
        const images = results.map((item) => item.key);
        fetchImages(images);
        messageApi.open({
          type: 'info',
          content: 'No tag filter specified, loading all images',
       });
      })
      .catch(() => {
        messageApi.open({
          type: 'error',
          content: 'Failed to load images',
        })
      });
    }
  }, [images, messageApi]);

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
      setTagData([...tagData, { tag, value, key: tagData.length}]);
    }
  };

  const columns: ColumnsType<TagDataType> = useMemo(() => [
    {
      title: 'Tag',
      dataIndex: 'tag',
      key: 'tag',
      render: (tag: string, record: TagDataType) => {
        if (record.key === editTag?.key) {
          return (
            <Input value={tag} onChange={(e) => {
              setEditTag({...editTag, tag: e.target.value});
            }}/>
          );
        } else {
          return <span>{tag}</span>
        }
      },
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number, record: TagDataType) => {
        if (record.key === editTag?.key) {
          return (
            <InputNumber value={value} onChange={(value) => {
              setEditTag({...editTag, value: value? value : 1});
            }}/>
          );
        } else {
          return <span>{value}</span>
        }
      },
    }, {
      title: 'Remove',
      dataIndex: 'key',
      key: 'key',
      render: (key: number, record: TagDataType) => (
        <>
          <Button style={{marginRight: 8}} type='primary' danger onClick={() => {
            setTagData(tagData.filter((item) => item.key != key));
          }}>Delete</Button>
          {
            editTag?.key === key ? (
              <Button type='primary' onClick={() => {
                // TODO save tag change to db
                console.log('save');
                setEditTag(null);
              }}>
                Save
              </Button>
            ): (
              <Button type='primary' onClick={() => {
                setEditTag(record);
              }}>
                Edit
              </Button>
            )
          }
        </>
      ),
    }
  ], [tagData, editTag]);

  return (
    <div style={{ display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', overflowY: 'scroll',
      height: '100%'}}>
      {contextHolder}
      <div className='grid' style={{padding: 16, width: '100%', height: '100%', gridTemplateRows: '320px 300px'}}>
        {
          currentImages.map((obj) => (
            <Card
              hoverable
              key={obj.key}
              style={{ width: 240, height: 300 }}
              bodyStyle={{backgroundColor: '#fff'}}
              cover={<img alt="example" src={obj.url} />}
              actions={[
                <EditOutlined key="edit" onClick={() => {
                  showModal();
                }} />,
              ]}
            >
              <Meta title={obj.key} />
            </Card>
          ))
        }
      </div>
      <Modal
        title="Edit Tags"
        open={open}
        onOk={hideModel}
        onCancel={hideModel}
        style={{display: 'flex', flexDirection: 'column'}}
        okText="Save"
        cancelText="Cancel"
      >
        <Table style={{width: '100%'}} columns={columns} dataSource={tagData} />
        <Text style={{ marginTop: 12}}>Add New Tag</Text>
        <Space.Compact style={{width: '100%', paddingBottom: 12, paddingTop: 12}}>
          <Input onChange={(e) => {
              setTag(e.target.value);
            }} style={{ width: '60%' }} placeholder='Tag Name' />
          <InputNumber style={{ width: '40%' }} min={1} max={20} defaultValue={1} onChange={(value: number | null) => {
            setValue(value?value:0);
          }}placeholder='Least Amount' />
          <Button type='primary' onClick={addTagData}>Add</Button>
        </Space.Compact>
      </Modal>
    </div>
  )
}

export default Browse;