import { Card, Modal, Space, Tag } from 'antd'
import { QueryDataType } from './types';
import Meta from 'antd/es/card/Meta';
import { EditOutlined } from '@ant-design/icons';
import { useState } from 'react';

const queryData: QueryDataType[] = [
  {
    tag: 'tag1',
    value: 1,
    key: 0
  }, {
    tag: 'tag2',
    value: 2,
    key: 1
  }, {
    tag: 'tag3',
    value: 2,
    key: 2
  }
]

function Browse() {
  const [open, setOpen] = useState<boolean>(false);
  const showModal = () => setOpen(true);
  const hideModel = () => setOpen(false);


  return (
    <div style={{ display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ padding: 24}}>
        <Space size={[0, 8]} wrap>
          {
            queryData.map((item) => (
              <Tag closable onClose={() => {
                queryData.splice(item.key, 1);
              }}>{item.tag} - {item.value}</Tag>
            ))
          }
        </Space>
      </div>
      <div className='grid' style={{padding: 16, width: '100%'}}>
        {
          [...Array(15).keys()].map(() => (
            <Card
              hoverable
              style={{ width: 240 }}
              bodyStyle={{backgroundColor: '#fff'}}
              cover={<img alt="example" src="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png" />}
              actions={[
                <EditOutlined key="edit" onClick={showModal} />,
              ]}
            >
              <Meta title="Europe Street beat" description="www.instagram.com" />
            </Card>
          ))
        }
      </div>
      <Modal
        title="Edit Tags"
        open={open}
        onOk={hideModel}
        onCancel={hideModel}
        okText="Save"
        cancelText="Cancel"
      >
        <h1>Nothing here for now</h1>
      </Modal>
    </div>
  )
}

export default Browse;