import React, { useEffect, useState, useRef } from 'react'
import { Button, Textarea } from '@headlessui/react'
import { Message } from './molecules';

const messages = [
  {
    sender: 'user',
    content: 'Hello, how are you?'
  },
  {
    sender: 'bot',
    content: 'I am fine, thank you.'
  },
  {
    sender: 'bot',
    content: 'How can I help you today?'
  },
  {
    sender: 'user',
    content: 'I need help with my travel plan.'
  },
  {
    sender: 'bot',
    content: 'Sure, where are you planning to go?'
  },
  {
    sender: 'user',
    content: 'Hello, how are you?'
  },
  {
    sender: 'bot',
    content: 'I am fine, thank you.'
  },
  {
    sender: 'bot',
    content: 'How can I help you today?'
  },
  {
    sender: 'user',
    content: 'I need help with my travel plan.'
  },
  {
    sender: 'bot',
    content: 'Sure, where are you planning to go?'
  },
]

const placeholderCandidates = [
  'You are a chatbot, only response precisely.',
  '你是一位旅行顧問，熟悉各國的旅遊景點和行程安排。你正在幫助一位顧客規劃他們的下一次海外旅行。請根據顧客的興趣和需求，提供合適的旅遊建議，並為他們制定一個全面的旅行計劃。',
  '你是一位友好的餐廳服務員，熟悉菜單上的所有菜餚及其食材。你的任務是幫助顧客選擇合適的餐點，並確保他們有愉快的用餐體驗。請根據顧客的口味偏好和飲食習慣提出推薦。',
  '你是一位有經驗的幼兒教育專家，對不同年齡段的兒童發展有深入了解。今天你需要為一位家長提供育兒建議，幫助他們解決孩子在學習或行為上的問題。請根據家長的描述，提出具體的教育建議和方法。',
  '你是一位菜市場的攤販。你熱情地招呼顧客,介紹今天的新鮮蔬果,回答關於食材的問題,並提供烹飪建議。使用親切而略帶幽默的語氣,偶爾提供優惠來吸引顧客。',
  '你是一位熱心的鄰居,正在社區公園散步。你喜歡與人聊天,分享社區新聞和八卦。談論天氣、附近的新店面、即將到來的社區活動等話題。表現得友好但不要過於打探他人隱私。',
]

export default function Chatbox() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [placeholderText, setPlaceholderText] = React.useState(placeholderCandidates[0]);
  const [system_prompt, setSystemPrompt] = useState(''); 
  const ws = useRef(null);
  let eos = true;

  useEffect(() => {
    // randomize placeholder text
    // setPlaceholderText(placeholderCandidates[Math.floor(Math.random() * placeholderCandidates.length)]);
    setPlaceholderText(placeholderCandidates[0]);

    // Initialize WebSocket connection
    ws.current = new WebSocket('ws://localhost:8080/ws');
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.eos) {
        // If 'eos' is true, finalize the current message sequence and reset buffer
        eos = true;
      } else {
        if (eos) {
          // If 'eos' is true, start a new message sequence
          setMessages(prevMessages => [...prevMessages, message]);
          eos = false;
        }
        else{
          // If 'eos' is false, append the message to the current message sequence
          setMessages((prevMessages) => {
            if (message.eos === true){
              return [...prevMessages]
            }
            // First, check if there are any previous messages
            if (prevMessages.length === 0) {
              // If no previous messages, simply add the new message
              return [message];
            } else {
              // If there are previous messages, check if the last message's type matches the new message's type
              const lastMessage = prevMessages[prevMessages.length - 1];
              if (message.type === lastMessage.type) {
                // If the types match, concatenate the data of the new message to the last message
                return [
                  ...prevMessages.slice(0, -1), // All messages except the last
                  { ...lastMessage, data: lastMessage.data + message.data } // Updated last message
                ];
              } else {
                // If the types do not match, simply add the new message to the array
                return [...prevMessages, message];
              }
            }
          });          
        }
      }
        console.log('Received message:', message);
    };
    ws.current.onopen = () => {
      console.log('WebSocket connected');
      ws.current.send(JSON.stringify({ type: 'connect_text' }));
    };
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup function to close WebSocket connection
    return () => {
      ws.current.close();
    }

  }, []);

  const sendMessage = () => {
    if (ws.current && inputText.trim()) {
      const message = { type: 'user_text', data: inputText, input_timestamp: Date.now() / 1000 };
      ws.current.send(JSON.stringify(message));  // Send message as a stringified JSON
      setMessages(prevMessages => [...prevMessages, message]);  // Optionally add to local state immediately
      setInputText('');  // Clear input field
      console.log('Sent message:', message);
    }
  };

  const sendSystemPrompt = () => {
    if (ws.current) {
      if (system_prompt.trim()) {
        const systemPrompt = { type: 'system_prompt', data: system_prompt, input_timestamp: Date.now() / 1000 };
        ws.current.send(JSON.stringify(systemPrompt));
        setSystemPrompt('');
        console.log('Sent system prompt:', systemPrompt);
      }else{
        const systemPrompt = { type: 'system_prompt', data: placeholderText, input_timestamp: Date.now() / 1000 };
        ws.current.send(JSON.stringify(systemPrompt));
        setSystemPrompt('');
        console.log('Sent system prompt:', systemPrompt);
      }
    }
  };

  return <div className='w-full pb-2'>
    <div className='mb-4 p-2 w-full h-[30rem] flex flex-col overflow-auto flex-nowrap items-center rounded-lg bg-gray-700 '>
      {
        messages.map((message, index) => {
          return <Message key={index} message={message}/>
        })
      }
    </div>
    <div className='w-full' name="systemPrompt">
      <p className="text-slate-300 font-bold">System Prompt</p>
      <div className='flex flex-row w-full min-h-16 py-2'>
        <Textarea type="text" className="text-wrap px-2 py-1 w-11/12 mr-2 items-center rounded-lg bg-gray-700 text-white" placeholder={placeholderText}
        value={system_prompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        />
        <Button className="px-1 bg-blue-500 text-white rounded-lg hover:bg-blue-400 place-self-end h-8" onClick={sendSystemPrompt}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
        </Button>
      </div>
    </div>
    <div className='w-full' name="inputText">
      <p className="text-slate-300 font-bold">Input Text</p>
      <div className='flex flex-row w-full min-h-16 py-2'>
        <Textarea
          type="text"
          className="text-wrap px-2 py-1 w-11/12 mr-2 items-center rounded-lg bg-gray-700 text-white"
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <Button className="px-1 bg-blue-500 text-white rounded-lg hover:bg-blue-400 place-self-end h-8" onClick={sendMessage}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
        </Button>
      </div>
    </div>
  </div>
};
