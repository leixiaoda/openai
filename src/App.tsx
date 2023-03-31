import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';

import { Input } from 'antd';

import { NETWORK_STATUS, ROLE, KEY_3_POINT_5 } from './common/constant';
import './App.less';

const { TextArea } = Input;

interface Dialog {
  role: ROLE,
  content: string,
} 

function App() {
  const [status, setStatus] = useState(NETWORK_STATUS.UNKNOWN);
  const [result, setResult] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [dialogList, setDialogList] = useState<Dialog[]>([]);
  const scrollListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (dialogList.length && dialogList[dialogList.length - 1].role === ROLE.USER) {
      sendRequest(inputValue);
      setInputValue('');
    }
    scrollListRef.current?.scrollTo(0, scrollListRef.current.scrollHeight);
  }, [dialogList]);

  const sendRequest = (content: string) => {
    const body = JSON.stringify({
      'model': 'gpt-3.5-turbo',
      'messages': [{
        'role': 'user',
        'content': content,
      }],
    });
    
    setStatus(NETWORK_STATUS.PENDING);
    fetch('/v1/chat/completions', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEY_3_POINT_5}`,
      },
    }).then(res =>res.json()).then(res => {
      const { choices } = res;
      if (choices.length <= 0) {
        console.log('error: choices is null');
        setStatus(NETWORK_STATUS.ERROR);
        return;
      }

      choices.map((c: any) => {
        setDialogList([...dialogList, {
          role: ROLE.ASSISTANT,
          content: c.message.content,
        }]);
      });
      setStatus(NETWORK_STATUS.FINISHED);
    }).catch(error => {
      console.log('error: ', error.toString());
      setStatus(NETWORK_STATUS.ERROR);
    });
  }

  const onInputChange = (e: any) => {
    setInputValue(e.target.value);
  }

  const onPressKeydown = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.metaKey) {
      setInputValue(inputValue + '\n');
    } else {
      setDialogList([...dialogList, {
        role: ROLE.USER,
        content: inputValue,
      }]);
    }
  }

  const renderDialog = (dialog: Dialog, index: number) => (
    <div
      key={index}
      className={classNames('dialog', {
        'is-user': dialog.role === ROLE.USER,
      })}
    >
      {dialog.content}
    </div>
  );

  const renderMainBox = () => (
    <div className='main-box' ref={scrollListRef}>
      {dialogList.map(renderDialog)}
    </div>
  );

  const renderInput = () => {
    return (
      <div className='input-wrapper'>
        <TextArea
          ref={inputRef}
          value={inputValue}
          className="input"
          onChange={onInputChange}
          placeholder="请输入..."
          autoSize={{ minRows: 3, maxRows: 10 }}
          onPressEnter={onPressKeydown}
          disabled={status === NETWORK_STATUS.PENDING}
        />
      </div>
    );
  };

  return (
    <div className="App">
      {renderMainBox()}
      {renderInput()}
    </div>
  );
}

export default App;
