import React from 'react';
import './EditWidget.css'; // Uses the shared styles with EditWidget

const ChatWidget = ({
  settings,
  isOpen,
  setIsOpen,
  messages,
  inputMessage,
  setInputMessage,
  handleSendMessage,
}) => {
  const generateGradient = settings.useGradient
    ? `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`
    : settings.primaryColor;

  return (
    <>
      {/* Floating chat icon */}
      <div className="chat-widget-icon" onClick={() => setIsOpen(!isOpen)} style={{ background: generateGradient }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="chat-icon-svg">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 1.93.88 3.68 2.34 5.07L3 21l4.5-1.76C8.56 19.74 10.23 20 12 20c5.52 0 10-3.58 10-9s-4.48-8-10-8zm0 14c-1.21 0-2.38-.23-3.46-.68l-.35-.15-2.09.81.4-2.34-.24-.26C5.44 13.49 5 12.29 5 11c0-3.31 3.59-6 8-6s8 2.69 8 6-3.59 6-8 6z" />
          <circle cx="9" cy="11" r="1" />
          <circle cx="12" cy="11" r="1" />
          <circle cx="15" cy="11" r="1" />
        </svg>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div
          className="chat-popup-container"
          style={{ borderRadius: settings.cornerRadius }}
        >
        <div className="chat-popup-header" style={{ background: generateGradient }}>
          {settings.chatHeaderText ?? 'Chat Support'}
        </div>


          <div className="chat-popup-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message ${msg.from === 'system' ? 'system-message' : 'user-message'}`}
                style={{ borderRadius: settings.cornerRadius }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="chat-popup-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              style={{ borderRadius: settings.cornerRadius }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                borderRadius: settings.cornerRadius,
                background: generateGradient,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
