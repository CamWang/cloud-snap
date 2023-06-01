import { Button, Card, Input, InputNumber, Modal, Space, Tag, Typography, message } from 'antd'
import { TagDataType } from './types';
import Meta from 'antd/es/card/Meta';
import { EditOutlined } from '@ant-design/icons';
import Table, { ColumnsType } from 'antd/es/table';
import { useState, useMemo, useEffect } from 'react';
import { Storage } from 'aws-amplify';

const {Text} = Typography;

// const testTagData: TagDataType[] = [
//   {
//     tag: 'tag1',
//     value: 1,
//     key: 0
//   }, {
//     tag: 'tag2',
//     value: 2,
//     key: 1
//   }, {
//     tag: 'tag3',
//     value: 2,
//     key: 2
//   }
// ]

type ImageDataType = {
  key: string;
  url: string;
}

function Browse() {
  const [messageApi, contextHolder] = message.useMessage();

  const [open, setOpen] = useState<boolean>(false);
  const showModal = () => {
    setOpen(true)
  };
  const hideModel = () => setOpen(false);

  const [tagData, setTagData] = useState<TagDataType[]>([]);
  const [editTag, setEditTag] = useState<TagDataType | null>(null);

  const [tag, setTag] = useState<string>('');
  const [value, setValue] = useState<number>(1);

  const [images, setImages] = useState<ImageDataType[]>([]);
  
  useEffect(() => {
    Storage.list('')
      .then(({ results }) => {
        const imagePromises = results.map(async (item) => {
          if (item.key) {
            const url = await Storage.get(item.key, { level: 'public' });
            return {
              key: item.key,
              url: url,
            };
          }
          return null;
        });
  
        Promise.all(imagePromises)
          .then((imageList) => {
            setImages(imageList.filter(image => image !== null) ? imageList.filter(image => image !== null) as ImageDataType[] : []);
          });
      })
      .catch(() => {
        messageApi.open({
          type: 'error',
          content: 'Failed to load images',
        })
      });
  }, [messageApi]);

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
      <div style={{ paddingTop: 84, paddingBottom: 24}}>
        <Text style={{marginRight: 12, fontWeight: 'bold'}}>Filters: </Text>
        <Space size={[0, 8]} wrap>
          {
            tagData.map((item) => (
              <Tag color='blue' key={item.tag} style={{padding:8}} closable onClose={() => {
                tagData.splice(item.key, 1);
              }}>{item.tag} - {item.value}</Tag>
            ))
          }
        </Space>
      </div>
      <div className='grid' style={{padding: 16, width: '100%', height: '100%'}}>
        {
          images.map((obj) => (
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