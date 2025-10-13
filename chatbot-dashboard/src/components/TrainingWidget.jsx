import React, { useState } from 'react';
import axios from 'axios';
import './TrainingWidget.css';

export default function TrainingWidget() {
  const [websiteURL, setWebsiteURL] = useState('');
  const [helpfulLinks, setHelpfulLinks] = useState(['']);
  const [customText, setCustomText] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [contactLink, setContactLink] = useState('');
  const [pdfFiles, setPdfFiles] = useState([]);
  const [errors, setErrors] = useState({});

  const handleLinkChange = (index, value) => {
    const links = [...helpfulLinks];
    links[index] = value;
    setHelpfulLinks(links);
  };

  const addLinkField = () => {
    setHelpfulLinks([...helpfulLinks, '']);
  };

  const removeLinkField = (index) => {
    const links = [...helpfulLinks];
    links.splice(index, 1);
    setHelpfulLinks(links);
  };

  const handlePDFUpload = (e) => {
    setPdfFiles([...e.target.files]);
  };

  const validateFields = () => {
    const newErrors = {};
    if (!businessName.trim()) newErrors.businessName = 'Business Name is required';
    if (!websiteURL.trim()) newErrors.websiteURL = 'Website URL is required';
    if (!businessCategory.trim()) newErrors.businessCategory = 'Business Category is required';
    if (!contactLink.trim()) newErrors.contactLink = 'Contact Link is required';
    if (!customText.trim()) newErrors.customText = 'Training Info is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTrain = async () => {
    if (!validateFields()) return;

    const formData = new FormData();
    formData.append('TrainingText', customText);
    formData.append('ContactLink', contactLink);
    formData.append('BusinessCategory', businessCategory);

    helpfulLinks.forEach(link => {
      if (link.trim()) formData.append('HelpfulLinks', link);
    });

    Array.from(pdfFiles).forEach(file => {
      formData.append('PdfFiles', file);
    });

    try {
      await axios.post('https://localhost:7237/api/setup/full', formData);
      alert('Chatbot trained and saved successfully.');
    } catch (error) {
      console.error('Error saving chatbot setup:', error);
      alert('There was an error saving the setup.');
    }
  };

  const renderError = (field) => (
    errors[field] && <div className="error">{errors[field]}</div>
  );

  return (
    <div className="container">
      <h2 className="header">Train Chatbot</h2>

      <label className="label">Business Name</label>
      <input
        type="text"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        className="input"
      />
      {renderError('businessName')}

      <label className="label">Website URL</label>
      <input
        type="url"
        value={websiteURL}
        onChange={(e) => setWebsiteURL(e.target.value)}
        className="input"
      />
      {renderError('websiteURL')}

      <label className="label">Helpful Links</label>
      {helpfulLinks.map((link, index) => (
  <div key={index} className="input-group">
    <input
      type="url"
      value={link}
      onChange={(e) => handleLinkChange(index, e.target.value)}
      placeholder="https://example.com"
      className="link-input"
    />
    <button
      type="button"
      onClick={() => removeLinkField(index)}
      className="delete-button"
    >
      Delete
    </button>
  </div>
))}

      <div style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={addLinkField}
          className="add-button"
        >
          + Add another link
        </button>
      </div>

      <label className="label">Business Category</label>
      <input
        type="text"
        value={businessCategory}
        onChange={(e) => setBusinessCategory(e.target.value)}
        className="input"
      />
      {renderError('businessCategory')}

      <label className="label">Contact Link</label>
      <input
        type="url"
        value={contactLink}
        onChange={(e) => setContactLink(e.target.value)}
        className="input"
      />
      {renderError('contactLink')}

      <label className="label">Custom Training Info</label>
      <textarea
        value={customText}
        onChange={(e) => setCustomText(e.target.value)}
        className="textarea"
      />
      {renderError('customText')}

      <label className="label">Upload PDFs</label>
      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={handlePDFUpload}
        className="file-input"
      />

      <button
        type="button"
        onClick={handleTrain}
        className="train-button"
      >
        Train Chatbot
      </button>
    </div>
  );
}
