const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use('/public', express.static(path.join(__dirname, 'public')));

const downloadMedia = async (url) => {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'My Compression Service',
        'Referer': 'https://www.google.com',
        'Accept': 'image/webp,image/apng,image/*,video/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors du téléchargement du média:', error.response?.status, error.message);
    throw new Error("Échec du téléchargement du média avec le statut: ", error.response?.status);
  }
};

app.post('/api/compress', async (req, res) => {
  const { url, type } = req.body;
  if (type !== 'image' && type !== 'video') {
    return res.status(400).send('Type de média non supporté');
  }

  const mediaDataStream = await downloadMedia(url);
  const mediaExtension = type === 'image' ? 'png' : 'mp4';
  const tempPath = path.join(__dirname, `temp_media.${mediaExtension}`);
  const writer = fs.createWriteStream(tempPath);

  writer.on('error', (error) => {
    console.error('Erreur lors de l\'écriture du fichier temporaire:', error);
    res.status(500).send('Erreur lors de l\'écriture du fichier temporaire.');
  });

  mediaDataStream.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  const publicOutputPath = path.join('public', `${Date.now()}_compressed.${type === 'image' ? 'webp' : 'mp4'}`);

  try {
    if (type === 'image') {
      await sharp(tempPath)
        .resize(1024)
        .toFormat('webp')
        .webp({ quality: 80 })
        .toFile(path.join(__dirname, publicOutputPath));
    } else {
      await new Promise((resolve, reject) => {
        ffmpeg(tempPath)
          .outputOptions([
            '-vcodec libx264',
            '-crf 28',
            '-preset veryfast',
          ])
          .on('error', reject)
          .on('end', resolve)
          .save(path.join(__dirname, publicOutputPath));
      });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/${publicOutputPath}`;
    res.send({ url: fileUrl });
  } catch (error) {
    console.error(`Erreur lors de la compression du ${type}:`, error);
    res.status(500).send(`Erreur interne du serveur lors de la compression du ${type}.`);
  } finally {
    try {
      await fs.remove(tempPath);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier temporaire:', error);
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
