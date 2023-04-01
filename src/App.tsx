import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';

import { Input } from 'antd';

import { NETWORK_STATUS, ROLE } from './common/constant';
import './App.less';

const { TextArea } = Input;

interface Dialog {
  role: ROLE,
  content: string,
} 

function App() {
  const [status, setStatus] = useState(NETWORK_STATUS.UNKNOWN);
  const [inputValue, setInputValue] = useState('');
  const [dialogList, setDialogList] = useState<Dialog[]>([]);
  const scrollListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const apiKey = useRef('');

  const addDialog = (role: ROLE, content: string) => {
    setDialogList([...dialogList, { role, content }]);
  }

  const sendRequest = (content: string) => {
    const body = JSON.stringify({
      'model': 'gpt-3.5-turbo',
      'messages': [{
        'role': 'user',
        'content': content,
      }],
    });
    
    setStatus(NETWORK_STATUS.PENDING);
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.current}`,
      },
    }).then(res =>res.json()).then(res => {
      const { choices, error } = res;
      
      if (error || choices.length <= 0) {
        const errInfo = error ? `${error.code}: ${error.message}` : 'choices is null';
        addDialog(ROLE.ASSISTANT, `error: ,${errInfo}`);
        setStatus(NETWORK_STATUS.ERROR);
        return;
      }

      choices.forEach((c: any) => {
        addDialog(ROLE.ASSISTANT, c.message.content);
      });
      setStatus(NETWORK_STATUS.FINISHED);
    }).catch(error => {
      addDialog(ROLE.ASSISTANT, `error: , ${error.toString()}`);
      setStatus(NETWORK_STATUS.ERROR);
    });
  };

  useEffect(() => {
    if (dialogList.length && dialogList[dialogList.length - 1].role === ROLE.USER) {
      if (apiKey.current.length) {
        sendRequest(inputValue);
      } else {
        apiKey.current = inputValue;
      }
      setInputValue('');
    }
    scrollListRef.current?.scrollTo(0, scrollListRef.current.scrollHeight);
  }, [dialogList]);

  const onInputChange = (e: any) => {
    setInputValue(e.target.value);
  };

  const onPressKeydown = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.metaKey) {
      setInputValue(inputValue + '\n');
    } else {
      addDialog(ROLE.USER, inputValue);
    }
  };

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
