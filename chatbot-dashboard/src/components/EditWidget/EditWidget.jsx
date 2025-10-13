import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChatWidget from './ChatWidget';
import './EditWidget.css';
import { useParams } from 'react-router-dom';

const EditWidget = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    projectId: '',
    inactiveMessage: '👋 Hey! Still there? Let us know if you have any questions. 💬',
    primaryColor: '#6a11cb',
    secondaryColor: '#2575fc',
    useGradient: true,
    cornerRadius: 16,
    scriptTag: '',
    chatHeaderText: 'Chat Support',
  });

  const [widgetPreviewOpen, setWidgetPreviewOpen] = useState(true);
  const [enableInactiveMessage, setEnableInactiveMessage] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [countdown, setCountdown] = useState(null); // null when inactive

  const { projectId } = useParams();

  const saveSettingsToDB = async () => {
    const payload = { ...settings, projectId};

    console.log('🟡 Saving settings...');

    try {
      // Try fetching to see if the project already exists
      await axios.get(`https://localhost:7237/api/WidgetSettings/${projectId}`);
      
      // If it exists, update it
      await axios.put(`https://localhost:7237/api/WidgetSettings/${projectId}`, payload);
    } catch (err) {
      // If not found (404), create new settings
      if (err.response && err.response.status === 404) {
        await axios.post(`https://localhost:7237/api/WidgetSettings`, payload);
      } else {
        console.error('Failed to save settings:', err);
        alert('Something went wrong while saving widget settings.');
        return false;
      }
    }
  
    return true;
  };
  


  
  // Handle countdown for inactive message / UI display
  useEffect(() => {
    if (!enableInactiveMessage || isOpen) {
      setCountdown(null);
      return;
    }
  
    const timeSinceInteraction = Date.now() - lastInteraction;
    if (timeSinceInteraction < 10000) {
      const secondsRemaining = Math.ceil((10000 - timeSinceInteraction) / 1000);
      setCountdown(secondsRemaining);
    }
  
    const interval = setInterval(() => {
      const timePassed = Date.now() - lastInteraction;
      const secondsLeft = Math.ceil((10000 - timePassed) / 1000);
  
      if (secondsLeft <= 0) {
        setCountdown(null);
        clearInterval(interval);
      } else {
        setCountdown(secondsLeft);
      }
    }, 1000);
  
    return () => clearInterval(interval);
  }, [enableInactiveMessage, isOpen, lastInteraction]);
  
  



  // Trigger inactive message
  useEffect(() => {
    if (!enableInactiveMessage || isOpen) return;
  
    const interval = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastInteraction;
  
      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (msg) => msg.from === 'system' && msg.text === settings.inactiveMessage
        );
  
        if (timeSinceInteraction > 10000 && !alreadyExists) {
          setIsOpen(true);
          return [...prevMessages, { text: settings.inactiveMessage, from: 'system' }];
        }
  
        return prevMessages;
      });
    }, 1000);
  
    return () => clearInterval(interval);
  }, [enableInactiveMessage, isOpen, lastInteraction, settings.inactiveMessage]);
  
  

  // Handle Inactive message open/close
  useEffect(() => {
    if (!enableInactiveMessage) {
      setMessages((prevMessages) =>
        prevMessages.filter(
          (msg) =>
            !(msg.from === 'system' && msg.text === settings.inactiveMessage)
        )
      );
    }
  }, [enableInactiveMessage, settings.inactiveMessage]);

 // Reset interaction timer when enabling inactive message
 useEffect(() => {
  if (enableInactiveMessage) {
    setIsOpen(false); // close the chat window
    setLastInteraction(Date.now()); // reset timer
    setMessages((prevMessages) =>
      prevMessages.filter(
        (msg) =>
          !(msg.from === 'system' && msg.text === settings.inactiveMessage)
      )
    );
  }
}, [enableInactiveMessage, settings.inactiveMessage]);




  // Delayed widget appearance
  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));

    if (field === 'inactiveMessage') {
      // Remove any old inactive messages from the chat log
      setMessages((prevMessages) =>
        prevMessages.filter(
          (msg) => !(msg.from === 'system')
        )
      );
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, { text: inputMessage, from: 'user' }]);
      setInputMessage('');
      setLastInteraction(Date.now()); // ✅ reset inactivity timer
    }
  };

  const generateGradient = settings.useGradient
    ? `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`
    : settings.primaryColor;

  return (
    <div className="edit-widget-container">
      <div className="edit-widget-editor">
        <h2 className="edit-widget-title">Edit Widget</h2>

        <label className="edit-widget-label">
          Enable Inactive Message
          <span
            className="tooltip-icon"
            title="This message appears if the user doesn't interact with the chat icon within 10 seconds."
          >
            ℹ️
          </span>
        </label>
        <input
          type="checkbox"
          checked={enableInactiveMessage}
          onChange={(e) => setEnableInactiveMessage(e.target.checked)}
        />

 {/* Show countdown if inactive message is enabled and countdown is not null  */}
 
{enableInactiveMessage && countdown !== null && (
  <span style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
    Showing message in {countdown}s
  </span>
)}

        {enableInactiveMessage && (
          <textarea
            className="edit-widget-textarea"
            value={settings.inactiveMessage}
            onChange={(e) => handleChange('inactiveMessage', e.target.value)}
          />
        )}

        <label className="edit-widget-label">Primary Color</label>
        <input
          type="color"
          value={settings.primaryColor}
          onChange={(e) => handleChange('primaryColor', e.target.value)}
        />

        <label className="edit-widget-label">Secondary Color</label>
        <input
          type="color"
          value={settings.secondaryColor}
          onChange={(e) => handleChange('secondaryColor', e.target.value)}
          disabled={!settings.useGradient}
        />

        <label className="edit-widget-label">
          <input
            type="checkbox"
            checked={settings.useGradient}
            onChange={(e) => handleChange('useGradient', e.target.checked)}
          />{' '}
          Use Gradient
        </label>

        <label className="edit-widget-label">
          Corner Radius ({settings.cornerRadius}px)
        </label>
        <input
          type="range"
          min="0"
          max="30"
          value={settings.cornerRadius}
          onChange={(e) => handleChange('cornerRadius', parseInt(e.target.value))}
        />

         <label className="edit-widget-label">Chat Header Text</label>
         <input
           type="text"
           className="edit-widget-input"
           value={settings.chatHeaderText || ''}
           onChange={(e) => handleChange('chatHeaderText', e.target.value)}
           placeholder="Chat Support"
          />
      </div>

      {/* Navigation Button */}
      <div className="edit-widget-footer">
      <button
  className="chat-widget-button"
  onClick={async () => {
    console.log('🟢 Next button clicked');
    const success = await saveSettingsToDB();
    if (success) {
      console.log('✅ Save success, navigating...');
      navigate('/training-widget');
    }
  }}
>
  Next
</button>
      </div>

      {/* Chat Widget */}
      {showWidget && (
        <ChatWidget
          settings={settings}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
};

export default EditWidget;
