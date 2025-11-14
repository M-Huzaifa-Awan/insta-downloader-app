import React, { useState } from 'react';
import { Download, Link2, Loader2, CheckCircle, XCircle, Video, Image, RefreshCw, Volume2 } from 'lucide-react';

export default function InstaDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

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
      // Use the working Instagram Reels Downloader API
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

      if (!apiResponse.ok) {
        throw new Error(`API Error: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      console.log('API Response:', data);

      // Check if the API call was successful
      if (!data.success || data.error) {
        throw new Error(data.message || 'Failed to download content');
      }

      // Parse the response based on the actual structure
      if (data.data && data.data.medias && data.data.medias.length > 0) {
        const mediaData = data.data;
        
        // Find video media (primary content)
        const videoMedia = mediaData.medias.find(media => media.type === 'video');
        const audioMedia = mediaData.medias.find(media => media.type === 'audio');
        
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
            allMedia: mediaData.medias // Store all media for multiple quality options
          });
        } else {
          throw new Error('No video content found in the response');
        }
      } else {
        throw new Error('No media found in the response');
      }

    } catch (err) {
      console.error('Download error:', err);
      setError(`Failed to download: ${err.message}. Please try again or use a different post.`);
    } finally {
      setLoading(false);
    }
  };

  const downloadMedia = async (mediaUrl, filename = 'instagram_video') => {
    try {
      // Method 1: Direct download using fetch and blob (for same-origin or CORS-enabled URLs)
      try {
        const response = await fetch(mediaUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${filename}_${Date.now()}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up blob URL
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          return;
        }
      } catch (fetchError) {
        console.log('Direct download failed, trying alternative method...');
      }

      // Method 2: Open in new tab for user to manually download
      const newTab = window.open(mediaUrl, '_blank');
      if (!newTab) {
        setError('Popup blocked! Please allow popups for this site and try again.');
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      // Final fallback
      window.open(mediaUrl, '_blank');
    }
  };

  const downloadAudio = async (audioUrl) => {
    if (!audioUrl) return;
    
    try {
      const newTab = window.open(audioUrl, '_blank');
      if (!newTab) {
        setError('Popup blocked! Please allow popups to download audio.');
      }
    } catch (error) {
      console.error('Audio download failed:', error);
      window.open(audioUrl, '_blank');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
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
          <p className="text-white/80 text-sm mt-2">
            No ads • No signup • 100% Free
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">
          {/* Input Section */}
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
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
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

          {/* Result Section */}
          {result && (
            <div className="mb-6">
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-800 font-bold text-lg">Ready to Download!</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      {result.username && (
                        <p className="text-green-700 text-sm">
                          By: @{result.username}
                        </p>
                      )}
                      {result.likeCount && (
                        <p className="text-green-600 text-sm">
                          ❤️ {result.likeCount.toLocaleString()} likes
                        </p>
                      )}
                      {result.location && (
                        <p className="text-green-600 text-sm">
                          📍 {result.location}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Video className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 text-sm font-medium">
                        Video • {result.quality} • {result.duration}s
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Thumbnail Preview */}
                {result.thumbnail && (
                  <div className="mb-4 rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
                    <img 
                      src={result.thumbnail} 
                      alt="Preview" 
                      className="max-h-64 w-auto object-contain rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Caption */}
                {result.caption && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {result.caption}
                    </p>
                  </div>
                )}
                
                {/* Download Buttons */}
                <div className="space-y-3">
                  {/* Main Video Download */}
                  <button
                    onClick={() => downloadMedia(result.downloadUrl, 'instagram_reel')}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download Video ({result.quality})
                  </button>

                  {/* Audio Download (if available) */}
                  {result.audioUrl && (
                    <button
                      onClick={() => downloadAudio(result.audioUrl)}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Volume2 className="w-5 h-5" />
                      Download Audio Only
                    </button>
                  )}

                  {/* Multiple Quality Options */}
                  {result.allMedia && result.allMedia.filter(media => media.type === 'video').length > 1 && (
                    <div className="mt-4">
                      <p className="text-gray-700 text-sm font-semibold mb-2">Other Quality Options:</p>
                      <div className="space-y-2">
                        {result.allMedia
                          .filter(media => media.type === 'video' && media.url !== result.downloadUrl)
                          .map((media, index) => (
                            <button
                              key={media.id || index}
                              onClick={() => downloadMedia(media.url, `instagram_${media.quality}`)}
                              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-between text-sm"
                            >
                              <span>Quality: {media.quality}</span>
                              <Download className="w-4 h-4" />
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* URL Info */}
                  <div className="p-3 bg-gray-100 rounded-lg mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-600 font-semibold">Video URL:</p>
                      <button
                        onClick={() => copyToClipboard(result.downloadUrl)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Copy URL
                      </button>
                    </div>
                    <p className="text-xs text-gray-700 break-all">{result.downloadUrl}</p>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-2">
                    💡 If download doesn't start automatically, the media will open in a new tab.
                    Right-click and select "Save as..." to download.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* How to Use */}
          <div className="mt-8 pt-6 border-t-2 border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
              <span className="text-2xl">📱</span>
              How to use:
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
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-green-500">✓</span>
                <span>High Quality</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-green-500">✓</span>
                <span>No Watermark</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-green-500">✓</span>
                <span>Fast Download</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-green-500">✓</span>
                <span>Posts & Reels</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-green-500">✓</span>
                <span>Audio Extraction</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-green-500">✓</span>
                <span>100% Free</span>
              </div>
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