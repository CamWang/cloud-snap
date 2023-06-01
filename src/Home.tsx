import { theme, Tabs, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons';
import { message, Upload, Button, Input, Space, InputNumber } from 'antd';
import Table, { ColumnsType } from 'antd/es/table';
import { useMemo, useState, useCallback, useContext } from 'react';
import { TagDataType } from './types';
import type { UploadRequestOption} from 'rc-upload/lib/interface';
import { Storage, API } from 'aws-amplify';
import { ImagesContext } from './context/ImagesContext';
import { useNavigate } from 'react-router-dom';

const apiName = 'CloudSnap API';
const path = '/search/tag';

const { Dragger } = Upload;

const { Title, Text } = Typography;

function Home() {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [tagData, setQueryData] = useState<TagDataType[]>([]);
  const [tag, setTag] = useState<string>('');
  const [value, setValue] = useState<number>(1);
  const {setImages} = useContext(ImagesContext);
  const addQueryData = () => {
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
      setQueryData([...tagData, { tag, value, key: tagData.length}]);
    }
  };

  const searchByTags = useCallback(() => {
    if (tagData.length == 0) {
      messageApi.open({
        type: 'error',
        content: 'Please add at least one tag',
      });
      return;
    }
    const tags = tagData.map((item) => ({
      tag: item.tag,
      count: item.value,
    }));
    const myInit = {
      body: {
        tags: tags
      }
    };
    API.post(apiName, path, myInit)
      .then((response) => {
        if (response.length == 0) {
          messageApi.open({
            type: 'error',
            content: 'No images found',
          });
          return;
        }
        setImages?.(response.map((item:string) => item.split('/')[1]));
        setQueryData([]);
        navigate('/browse');
      })
      .catch((error) => {
        console.log(error.response);
      });
  }, [messageApi, navigate, setImages, tagData]);

  const columns: ColumnsType<TagDataType> = useMemo(() => [
    {
      title: 'Tag',
      dataIndex: 'tag',
      key: 'tag',
      render: (tag: string) => <span>{tag}</span>,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => <span>{value}</span>,
    }, {
      title: 'Remove',
      dataIndex: 'key',
      key: 'key',
      render: (key: number) => (
        <Button type='primary' danger onClick={() => {
          setQueryData(tagData.filter((item) => item.key != key));
        }}>Delete</Button>
      ),
    }
  ], [tagData]);

  const uploadRequest = useCallback((options: UploadRequestOption) => {
    const { onSuccess, onError, file, onProgress  } = options;
    if (file instanceof File) {
      Storage.put(file.name, file, {
        resumable: true,
        progressCallback(progress) {
          onProgress?.({ percent: progress.loaded / progress.total * 100 });
        },
        completeCallback: (event) => {
          onSuccess?.(event);
          messageApi.open({
            type: 'success',
            content: 'Upload Successfully',
          });
        },
        errorCallback: (err) => {
          onError?.(err);
          messageApi.open({
            type: 'error',
            content: 'Upload Failed',
          });
        },
      });
    }
  }, [messageApi]);
  
  const searchRequest = useCallback((options: UploadRequestOption) => {
    const { onSuccess, onError, file, onProgress } = options;
    if (file instanceof File) {
      Storage.put(file.name, file, {
        resumable: true,
        level: 'private',
        progressCallback(progress) {
          onProgress?.({ percent: progress.loaded / progress.total * 100 });
        },
        completeCallback: (event) => {
          onSuccess?.(event);
          messageApi.open({
            type: 'success',
            content: 'Upload Successfully',
          });
        },
        errorCallback: (err) => {
          onError?.(err);
          messageApi.open({
            type: 'error',
            content: 'Upload Failed',
          });
        },
      });
    }
  }, [messageApi]);

  return (
    <>
      {contextHolder}
      <div style={{ display: 'flex', flexDirection: 'column', padding: 16, marginTop: 24 }}>
      <div style={{display: 'flex', marginBottom: 16}}>
        <img src='/cloudsnap.png' style={{ width: 64, height: 64, marginRight: 20 }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Title style={{lineHeight: '46px', marginBottom:0}}>CloudSnap</Title>
          <Text strong type='secondary' style={{marginBottom: '18px'}}>A Serverless Image Storage System with Object Tagging</Text>
        </div>
      </div>
      <Tabs
        tabBarStyle={{ marginBottom: 0 }}
        type="card"
        items={[{
          key: '1',
          label: 'Upload Image',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: colorBgContainer, padding: 24 }}>
              <Dragger customRequest={uploadRequest} style={{width: 400}}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  One Image At A Time, 5MB Max
                </p>
              </Dragger>
            </div>
          ),
        },{
          key: '2',
          label: 'Search By Image',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: colorBgContainer, padding: 24 }}>
              <Dragger customRequest={searchRequest} style={{width: 400}}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                One Image At A Time, 5MB Max
                </p>
              </Dragger>
              <Button type='primary' style={{width: 100, marginTop: 24}}>Search</Button>
            </div>
          ),
        },{
          key: '3',
          label: 'Search By Tags',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: colorBgContainer, padding: 16 }}>
              <Space direction='vertical'>
                <Space.Compact style={{width: 500}}>
                  <Table style={{width: 500}} columns={columns} dataSource={tagData} />
                </Space.Compact>
                <Space.Compact style={{marginTop: 16, display: 'flex'}}>
                  <Input onChange={(e) => {
                    setTag(e.target.value);
                  }} style={{ width: '60%' }} placeholder='Tag Name' />
                  <InputNumber min={1} max={20} defaultValue={1} onChange={(value: number | null) => {
                    setValue(value?value:0);
                  }} style={{ width: '40%' }} placeholder='Least Amount' />
                  <Button type='primary' onClick={addQueryData}>Add</Button>
                </Space.Compact>
                <Space style={{width: '100%', display: 'flex', justifyContent: 'center', marginTop: 24}}>
                  <Button type='primary' onClick={searchByTags} style={{width: 100}}>Search</Button>
                </Space>
              </Space>
            </div>
          ),
        }]}
      />
    </div>
    </>
  )
}


export default Home;