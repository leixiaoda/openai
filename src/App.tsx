import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';

import { Input } from 'antd';

import { NETWORK_STATUS, ROLE, COMMAND_NEW } from './common/constant';
import './App.less';

const { TextArea } = Input;

interface Dialog {
  role: ROLE,
  content: string,
  isContext: boolean,
} 

function App() {
  const [status, setStatus] = useState(NETWORK_STATUS.UNKNOWN);
  const [inputValue, setInputValue] = useState('');
  const [dialogList, setDialogList] = useState<Dialog[]>([]);
  const scrollListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const apiKey = useRef('');

  const addDialog = (role: ROLE, content: string, isContext: boolean) => {
    setDialogList([...dialogList, { role, content, isContext }]);
  };

  const getMsgs = () => {
    if (!dialogList.length) {
      return [];
    }

    const context: Dialog[] = [];
    for (var i = dialogList.length - 1; i >= 0 && dialogList[i].isContext; i--) {
      context.unshift(dialogList[i]);
    }
    return context.map(c => ({
      'role': c.role,
      'content': c.content,
    }));
  };

  const sendRequest = () => {
    const body = JSON.stringify({
      'model': 'gpt-3.5-turbo',
      'messages': getMsgs(),
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
        addDialog(ROLE.ASSISTANT, `error: ,${errInfo}`, false);
        setStatus(NETWORK_STATUS.ERROR);
        return;
      }

      choices.forEach((c: any) => {
        addDialog(ROLE.ASSISTANT, c.message.content, true);
      });
      setStatus(NETWORK_STATUS.FINISHED);
    }).catch(error => {
      addDialog(ROLE.ASSISTANT, `error: , ${error.toString()}`, false);
      setStatus(NETWORK_STATUS.ERROR);
    });
  };

  useEffect(() => {
    if (dialogList.length && dialogList[dialogList.length - 1].role === ROLE.USER) {
      if (dialogList[dialogList.length - 1].isContext) {
        sendRequest();
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
      if (apiKey.current.length) {
        if (inputValue.toLowerCase() === COMMAND_NEW) {
          addDialog(ROLE.USER, inputValue, false);
        } else {
          addDialog(ROLE.USER, inputValue, true);
        }
      } else {
        apiKey.current = inputValue;
        addDialog(ROLE.USER, inputValue, false);
      }
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
          placeholder="Please enter here..."
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
