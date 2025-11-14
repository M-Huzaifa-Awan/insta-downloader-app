import React, { useState } from 'react';
import { Download, Link2, Loader2, CheckCircle, XCircle, Video, ImageIcon } from 'lucide-react';

export default function InstaDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a valid Instagram URL');
      return;
    }

    const instaRegex = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|stories|tv)\/([A-Za-z0-9_-]+)/;
    if (!instaRegex.test(url)) {
      setError('Please enter a valid Instagram post, reel, or story URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const apiUrl = `https://instagram-reels-downloader-api.p.rapidapi.com/download?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'instagram-reels-downloader-api.p.rapidapi.com',
          'x-rapidapi-key': '3236d99f89mshf7c802731a1dca9p1b2c97jsn02bdb6c211f7'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setResult({
          downloadUrl: data.data.download_url || data.data.video_url || data.data.image_url,
          thumbnail: data.data.thumbnail_url,
          username: data.data.username,
          caption: data.data.caption,
          type: data.data.type || 'media'
        });
      } else {
        setError(data.message || 'Could not download media. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(`Failed to download: ${err.message}. Please check the URL and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'instagram_media';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-fade-in">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-semibold">Oops! Something went wrong</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Result Section */}
          {result && (
            <div className="mb-6 animate-fade-in">
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-800 font-bold text-lg">Ready to Download!</p>
                    {result.username && (
                      <p className="text-green-700 text-sm mt-1">
                        By: @{result.username}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {result.type === 'video' || result.type === 'reel' ? (
                        <Video className="w-4 h-4 text-green-600" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-green-600 text-sm font-medium capitalize">
                        {result.type || 'Media'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {result.thumbnail && (
                  <div className="mb-4 rounded-lg overflow-hidden shadow-md">
                    <img 
                      src={result.thumbnail} 
                      alt="Preview" 
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {result.caption && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 italic">
                    "{result.caption}"
                  </p>
                )}
                
                <button
                  onClick={() => downloadFile(result.downloadUrl, `instagram_${Date.now()}.mp4`)}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Download to Device
                </button>
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
                <span>Stories</span>
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