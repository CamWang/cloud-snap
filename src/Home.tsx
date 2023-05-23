import { theme, Tabs, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { message, Upload, Button, Input, Space, InputNumber } from 'antd';
import Table, { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';

const { Dragger } = Upload;

const { Title, Text } = Typography;

type QueryDataType = {
  tag: string;
  value: number;
  key: number;
}

function Home() {
  const [messageApi, contextHolder] = message.useMessage();

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [queryData, setQueryData] = useState<QueryDataType[]>([]);
  const [tag, setTag] = useState<string>('');
  const [value, setValue] = useState<number>(0);
  const addQueryData = () => {
    let fail = false;
    if (!tag || !value) {
      fail = true;
      messageApi.open({
        type: 'error',
        content: 'Please fill in the tag name and least amount',
      });
    }
    if (queryData.some((item) => item.tag == tag)) {
      fail = true;
      messageApi.open({
        type: 'error',
        content: 'Tag name already exists',
      });
    }
    if (!fail) {
      setQueryData([...queryData, { tag, value, key: queryData.length}]);
    }
  };

  const columns: ColumnsType<QueryDataType> = useMemo(() => [
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
          setQueryData(queryData.filter((item) => item.key != key));
        }}>Delete</Button>
      ),
    }
  ], [queryData]);

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
          label: 'Search By Image',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: colorBgContainer, padding: 16 }}>
              <Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                  Support for a single or bulk upload. Strictly prohibited from uploading company data or other
                  banned files.
                </p>
              </Dragger>
              <Button type='primary' style={{width: 100, marginTop: 24}}>Search</Button>
            </div>
          ),
        },{
          key: '2',
          label: 'Search By Tags',
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: colorBgContainer, padding: 16 }}>
              <Space direction='vertical'>
                <Space.Compact style={{width: '100%'}}>
                  <Table style={{width: '100%'}} columns={columns} dataSource={queryData} />
                </Space.Compact>
                <Space.Compact style={{marginTop: 16}}>
                  <Input onChange={(e) => {
                    setTag(e.target.value);
                  }} style={{ width: '60%' }} placeholder='Tag Name' />
                  <InputNumber min={1} max={20} defaultValue={1} onChange={(value: number | null) => {
                    setValue(value?value:0);
                  }} style={{ width: '40%' }} placeholder='Least Amount' />
                  <Button type='primary' onClick={addQueryData}>Add</Button>
                </Space.Compact>
                <Space style={{width: '100%', display: 'flex', justifyContent: 'center', marginTop: 24}}>
                  <Button type='primary' style={{width: 100}}>Search</Button>
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

const uploadProps: UploadProps = {
  name: 'file',
  multiple: true,
  action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
  onChange(info) {
    const { status } = info.file;
    if (status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (status === 'done') {
      message.success(`${info.file.name} file uploaded successfully.`);
    } else if (status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
  onDrop(e) {
    console.log('Dropped files', e.dataTransfer.files);
  },
};

export default Home;