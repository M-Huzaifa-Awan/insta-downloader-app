import React, { useState, useCallback } from 'react';
import { Download, Link2, Loader2, CheckCircle, XCircle, Video, Image, Volume2 } from 'lucide-react';

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${bg} text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-medium max-w-xs text-center`}>
      {type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
      {type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

export default function InstaDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  const validateInstagramUrl = (url) => {
    const instaRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|stories|tv)\/([A-Za-z0-9_-]+)/;
    return instaRegex.test(url);
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a valid Instagram URL');
      return;
    }

    if (!validateInstagramUrl(url)) {
      setError('Please enter a valid Instagram post, reel, or story URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const apiResponse = await fetch(
        `https://instagram-reels-downloader-api.p.rapidapi.com/download?url=${encodeURIComponent(url)}`,
        {
          method: 'GET',
          headers: {
            'x-rapidapi-key': '3236d99f89mshf7c802731a1dca9p1b2c97jsn02bdb6c211f7',
            'x-rapidapi-host': 'instagram-reels-downloader-api.p.rapidapi.com'
          }
        }
      );

      if (!apiResponse.ok) throw new Error(`API Error: ${apiResponse.status}`);

      const data = await apiResponse.json();
      console.log('API Response:', data);

      if (!data.success || data.error) {
        throw new Error(data.message || 'Failed to download content');
      }

      if (data.data && data.data.medias && data.data.medias.length > 0) {
        const mediaData = data.data;
        const videoMedia = mediaData.medias.find(m => m.type === 'video');
        const imageMedia = mediaData.medias.find(m => m.type === 'image' || m.type === 'photo');
        const audioMedia = mediaData.medias.find(m => m.type === 'audio');

        if (videoMedia) {
          setResult({
            downloadUrl: videoMedia.url,
            thumbnail: videoMedia.thumbnail || mediaData.thumbnail,
            username: mediaData.author || mediaData.owner?.username || '',
            caption: mediaData.title || '',
            type: 'video',
            quality: videoMedia.quality,
            duration: videoMedia.duration,
            likeCount: mediaData.like_count,
            location: mediaData.location?.name,
            audioUrl: audioMedia?.url,
            allMedia: mediaData.medias
          });
        } else if (imageMedia) {
          setResult({
            downloadUrl: imageMedia.url,
            thumbnail: imageMedia.url || mediaData.thumbnail,
            username: mediaData.author || mediaData.owner?.username || '',
            caption: mediaData.title || '',
            type: 'image',
            likeCount: mediaData.like_count,
            location: mediaData.location?.name,
            allMedia: mediaData.medias
          });
        } else if (mediaData.medias.length > 0) {
          const firstMedia = mediaData.medias[0];
          setResult({
            downloadUrl: firstMedia.url,
            thumbnail: firstMedia.thumbnail || firstMedia.url || mediaData.thumbnail,
            username: mediaData.author || mediaData.owner?.username || '',
            caption: mediaData.title || '',
            type: firstMedia.type || 'image',
            likeCount: mediaData.like_count,
            location: mediaData.location?.name,
            allMedia: mediaData.medias
          });
        } else {
          throw new Error('No media content found in the response');
        }
      } else {
        throw new Error('No media found in the response');
      }

    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to fetch info: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getFileExtension = (rawUrl, defaultExt = 'mp4') => {
    try {
      const urlPath = new URL(rawUrl).pathname;
      const match = urlPath.match(/\.(jpg|jpeg|png|gif|webp|mp4|mp3|mov|avi)$/i);
      return match ? match[1].toLowerCase() : defaultExt;
    } catch {
      return defaultExt;
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const downloadMedia = async (mediaUrl, filename = 'instagram_media', fileExtension = 'mp4') => {
    const ext = (fileExtension === 'jpg' || fileExtension === 'mp4')
      ? getFileExtension(mediaUrl, fileExtension)
      : fileExtension;

    // iOS Safari can't do blob downloads — open in new tab so user can long-press → Save
    if (isIOS) {
      window.open(mediaUrl, '_blank', 'noopener,noreferrer');
      showToast('Tap & hold the media → "Save to Photos" 📸', 'info');
      return;
    }

    // Desktop / Android: blob download
    try {
      const response = await fetch(mediaUrl, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error('Fetch failed');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${filename}_${Date.now()}.${ext}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
      showToast('Download started! Check your downloads folder ✅', 'success');

    } catch (err) {
      console.error('Blob download failed, trying direct link:', err);
      try {
        const link = document.createElement('a');
        link.href = mediaUrl;
        link.download = `${filename}_${Date.now()}.${ext}`;
        link.target = '_self';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Download started! Check your downloads folder ✅', 'success');
      } catch {
        try {
          await navigator.clipboard.writeText(mediaUrl);
          showToast('Link copied! Paste in browser to download 📋', 'info');
        } catch {
          showToast('Could not start download. Try opening the link manually.', 'error');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-3xl mx-auto pt-8 md:pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-2xl mb-4">
            <Download className="w-10 h-10 text-pink-500" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
            Insta Downloader
          </h1>
          <p className="text-white/95 text-xl font-medium">
            Download posts, reels & stories instantly
          </p>
          <p className="text-white/80 text-sm mt-2">No ads • No signup • 100% Free</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">

          {/* Input */}
          <div className="mb-6">
            <label className="block text-gray-800 font-semibold mb-3 text-lg">
              Paste Instagram Link
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDownload()}
                  placeholder="https://www.instagram.com/reel/..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none transition text-gray-700"
                />
              </div>
              <button
                onClick={handleDownload}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>Processing...</span></>
                ) : (
                  <><Download className="w-5 h-5" /><span>Download</span></>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-semibold">Download Failed</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mb-6">
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-800 font-bold text-lg">Ready to Download!</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      {result.username && <p className="text-green-700 text-sm">By: @{result.username}</p>}
                      {result.likeCount && <p className="text-green-600 text-sm">❤️ {result.likeCount.toLocaleString()} likes</p>}
                      {result.location && <p className="text-green-600 text-sm">📍 {result.location}</p>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {result.type === 'video' ? (
                        <><Video className="w-4 h-4 text-green-600" /><span className="text-green-600 text-sm font-medium">Video • {result.quality || 'HD'} • {result.duration || 'N/A'}s</span></>
                      ) : (
                        <><Image className="w-4 h-4 text-green-600" /><span className="text-green-600 text-sm font-medium">Image</span></>
                      )}
                    </div>
                  </div>
                </div>

                {result.thumbnail && (
                  <div className="mb-4 rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
                    <img src={result.thumbnail} alt="Preview" className="max-h-64 w-auto object-contain rounded-lg"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}

                {result.caption && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-700 text-sm leading-relaxed">{result.caption}</p>
                  </div>
                )}

                {/* iOS hint banner */}
                {isIOS && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">
                    📱 <strong>iPhone tip:</strong> Tap Download → media opens in new tab → long-press → <em>Save to Photos</em>
                  </div>
                )}

                <div className="space-y-3">
                  {result.type === 'video' ? (
                    <button onClick={() => downloadMedia(result.downloadUrl, 'instagram_reel', 'mp4')}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg">
                      <Download className="w-5 h-5" />
                      Download Video {result.quality ? `(${result.quality})` : ''}
                    </button>
                  ) : (
                    <button onClick={() => downloadMedia(result.downloadUrl, 'instagram_post', getFileExtension(result.downloadUrl, 'jpg'))}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg">
                      <Download className="w-5 h-5" />
                      Download Image
                    </button>
                  )}

                  {result.audioUrl && (
                    <button onClick={() => downloadMedia(result.audioUrl, 'instagram_audio', 'mp3')}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition flex items-center justify-center gap-2">
                      <Volume2 className="w-5 h-5" />
                      Download Audio Only
                    </button>
                  )}

                  {result.allMedia && result.type === 'video' &&
                    result.allMedia.filter(m => m.type === 'video').length > 1 && (
                    <div className="mt-4">
                      <p className="text-gray-700 text-sm font-semibold mb-2">Other Quality Options:</p>
                      <div className="space-y-2">
                        {result.allMedia.filter(m => m.type === 'video' && m.url !== result.downloadUrl)
                          .map((media, index) => (
                            <button key={media.id || index}
                              onClick={() => downloadMedia(media.url, `instagram_${media.quality}`, 'mp4')}
                              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-between text-sm">
                              <span>Quality: {media.quality}</span>
                              <Download className="w-4 h-4" />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {result.allMedia && result.type === 'image' &&
                    result.allMedia.filter(m => m.type === 'image' || m.type === 'photo').length > 1 && (
                    <div className="mt-4">
                      <p className="text-gray-700 text-sm font-semibold mb-2">All Images in Post:</p>
                      <div className="space-y-2">
                        {result.allMedia.filter(m => (m.type === 'image' || m.type === 'photo') && m.url !== result.downloadUrl)
                          .map((media, index) => (
                            <button key={media.id || index}
                              onClick={() => downloadMedia(media.url, `instagram_post_${index + 2}`, getFileExtension(media.url, 'jpg'))}
                              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-between text-sm">
                              <span>Image {index + 2}</span>
                              <Download className="w-4 h-4" />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 text-center mt-4">
                    💡 If download doesn't start, the link will be copied to your clipboard automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* How to Use */}
          <div className="mt-8 pt-6 border-t-2 border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
              <span className="text-2xl">📱</span> How to use:
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <span className="flex-shrink-0 w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <span className="text-gray-700 text-sm pt-0.5">Open Instagram and find your content</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                <span className="flex-shrink-0 w-7 h-7 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <span className="text-gray-700 text-sm pt-0.5">Tap the three dots (•••) menu</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <span className="flex-shrink-0 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <span className="text-gray-700 text-sm pt-0.5">Select "Copy link" or "Share"</span>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <span className="flex-shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
                <span className="text-gray-700 text-sm pt-0.5">Paste here and click Download!</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-3">✨ Features:</h4>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              {['High Quality', 'No Watermark', 'Fast Download', 'Posts & Reels', 'Audio Extraction', '100% Free'].map(f => (
                <div key={f} className="flex items-center gap-2 text-gray-700">
                  <span className="text-green-500">✓</span><span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/90 text-sm space-y-2">
          <p className="font-semibold">🚀 Built with React • Powered by RapidAPI</p>
          <p>Please respect content creators' rights and terms of service ❤️</p>
        </div>
      </div>
    </div>
  );
}