export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  try {
    const response = await fetch(
      `https://instagram-reels-downloader-api.p.rapidapi.com/download?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'x-rapidapi-host': 'instagram-reels-downloader-api.p.rapidapi.com',
          'x-rapidapi-key': '3236d99f89mshf7c802731a1dca9p1b2c97jsn02bdb6c211f7'
        }
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}