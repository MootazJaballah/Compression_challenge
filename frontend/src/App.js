import React, { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('image');
  const [compressedUrl, setCompressedUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (event) => {
    setUrl(event.target.value);
    setCompressedUrl(''); // Réinitialiser l'URL compressée lors de la saisie d'une nouvelle URL
    setErrorMessage('');  // Réinitialiser les messages d'erreur précédents
  };

  const handleTypeChange = (event) => {
    setType(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setCompressedUrl(''); // Réinitialiser l'URL compressée avant la nouvelle soumission
    setErrorMessage('');  // Réinitialiser les messages d'erreur précédents

    try {
      const response = await fetch('http://localhost:5000/api/compress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, type }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCompressedUrl(data.url); // Mettre à jour l'état avec l'URL du média compressé
    } catch (error) {
      console.error('Il y a eu un problème avec votre opération de fetch: ' + error.message);
      setErrorMessage('Il y a eu un problème lors de la compression du média.');
    }
  };

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={handleInputChange}
          placeholder="Entrez l'URL de l'image ou de la vidéo ici"
        />
        <div>
          <label>
            <input
              type="radio"
              value="image"
              checked={type === 'image'}
              onChange={handleTypeChange}
            /> Image
          </label>
          <label>
            <input
              type="radio"
              value="video"
              checked={type === 'video'}
              onChange={handleTypeChange}
            /> Vidéo
          </label>
        </div>
        <button type="submit">Compresser</button>
      </form>
      {compressedUrl && (
        <div className='URL'>
          <p>URL du média compressé :</p>
          <a href={compressedUrl} target="_blank" rel="noopener noreferrer">{compressedUrl}</a>
        </div>
      )}
      {errorMessage && <p className="error">{errorMessage}</p>}
      {compressedUrl && type === 'image' && (
        <div>
          <p>Image compressée :</p>
          <img src={compressedUrl} alt="Contenu compressé affiché" />
        </div>
      )}
      {compressedUrl && type === 'video' && (
        <div>
          <p>Vidéo compressée :</p>
          <video controls src={compressedUrl} />
        </div>
      )}
    </div>
  );
}

export default App;
