import React, { useState, useEffect } from 'react';
import { Search, Play, Settings, X, Loader2, Youtube, ExternalLink, Copy, Check, FileText, ChevronLeft, User, ArrowRight } from 'lucide-react';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState('channels');
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState(null);

  useEffect(() => {
    const k = localStorage.getItem('yt_api_key');
    if (k) setApiKey(k);
  }, []);

  useEffect(() => {
    if (apiKey) localStorage.setItem('yt_api_key', apiKey);
  }, [apiKey]);

  const decodeHtml = (html) => {
    try { const t = document.createElement('textarea'); t.innerHTML = html; return t.value; } catch(e){return html;}
  };

  const searchChannels = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!apiKey) return setShowSettings(true);
    setLoading(true);
    setChannels([]);
    setVideos([]);
    setViewMode('channels');
    try {
      const res = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=' + encodeURIComponent(query) + '&type=channel&key=' + apiKey);
      const data = await res.json();
      setChannels(data.items || []);
    } catch (err) {
      alert('검색 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = async (channel) => {
    setLoading(true);
    setSelectedChannel(channel);
    setVideos([]);
    try {
      const chRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=' + channel.id.channelId + '&key=' + apiKey);
      const chData = await chRes.json();
      if (chData.items && chData.items.length > 0) {
        const uploadsId = chData.items[0].contentDetails.relatedPlaylists.uploads;
        const vRes = await fetch('https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=' + uploadsId + '&key=' + apiKey);
        const vData = await vRes.json();
        setVideos(vData.items || []);
        setViewMode('videos');
      } else {
        alert('채널 정보 오류');
      }
    } catch (e) {
      alert('영상 로딩 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTactiq = (videoId) => {
    const youtubeUrl = 'https://www.youtube.com/watch?v=' + videoId;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(youtubeUrl).then(() => {
          setCopyStatus(videoId);
          setTimeout(() => setCopyStatus(null), 2000);
          window.open('https://tactiq.io/tools/youtube-transcript', '_blank');
        }).catch(() => window.open('https://tactiq.io/tools/youtube-transcript', '_blank'));
    } else {
        window.open('https://tactiq.io/tools/youtube-transcript', '_blank');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 font-sans text-gray-900'>
      <header className='bg-white shadow-sm sticky top-0 z-20 h-16 flex items-center px-4 gap-4'>
        <div className='flex items-center gap-2 text-red-600 font-bold text-lg cursor-pointer' onClick={() => window.location.reload()}>
          <Youtube fill='currentColor'/> Channel Explorer
        </div>
        <form onSubmit={searchChannels} className='flex-1 max-w-xl flex gap-2'>
          <input value={query} onChange={e=>setQuery(e.target.value)} className='flex-1 px-4 py-2 rounded-full border text-sm' placeholder='채널명 검색...' />
          <button className='bg-red-600 text-white px-5 py-2 rounded-full hover:bg-red-700'><Search size={18}/></button>
        </form>
        <button onClick={() => setShowSettings(!showSettings)} className='p-2 hover:bg-gray-100 rounded-full relative'>
          <Settings size={24}/> {!apiKey && <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>}
        </button>
      </header>
      {showSettings && <div className='bg-gray-800 p-4 text-white flex justify-center'><div className='flex gap-2 w-full max-w-2xl'><input type='password' value={apiKey} onChange={e=>setApiKey(e.target.value)} className='flex-1 p-2 rounded text-black text-sm' placeholder='YouTube API Key'/><button onClick={()=>setShowSettings(false)} className='bg-yellow-600 px-4 rounded text-sm font-bold'>저장</button></div></div>}
      <main className='max-w-7xl mx-auto p-4'>
        {loading && <div className='flex justify-center py-20'><Loader2 className='animate-spin text-red-600' size={48}/></div>}
        {!loading && viewMode === 'channels' && (
           channels.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {channels.map(c => (
                <div key={c.id.channelId} onClick={() => handleChannelClick(c)} className='bg-white rounded-xl shadow-sm p-6 flex flex-col items-center cursor-pointer hover:shadow-md border border-gray-100'>
                  <img src={c.snippet.thumbnails.medium.url} className='w-24 h-24 rounded-full mb-4 object-cover border-4 border-gray-50'/>
                  <h3 className='font-bold text-gray-900 text-center line-clamp-1 mb-2'>{decodeHtml(c.snippet.title)}</h3>
                  <span className='text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full font-medium'>채널 선택</span>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-32 text-gray-400'><User size={48} className='mx-auto mb-4 opacity-20'/><p>{query ? '검색 결과가 없습니다.' : '채널명을 검색하세요.'}</p></div>
          )
        )}
        {!loading && viewMode === 'videos' && selectedChannel ? (
          <div className='animate-in slide-in-from-right-4'>
            <div className='flex items-center gap-4 mb-6 pb-4 border-b border-gray-200'>
              <button onClick={() => setViewMode('channels')} className='p-2 hover:bg-gray-200 rounded-full'><ChevronLeft size={24}/></button>
              <div><h2 className='text-2xl font-bold text-gray-900'>{decodeHtml(selectedChannel.snippet.title)}</h2><p className='text-sm text-gray-500'>최신 영상 목록</p></div>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {videos.map(v => (
                <div key={v.snippet.resourceId.videoId} className='bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md border border-gray-100 group flex flex-col'>
                  <div className='aspect-video relative overflow-hidden bg-gray-200 cursor-pointer' onClick={() => window.open('https://www.youtube.com/watch?v=' + v.snippet.resourceId.videoId, '_blank') }>
                    <img src={v.snippet.thumbnails.medium?.url} className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'/>
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'><Play className='text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md' fill='white' size={48}/></div>
                  </div>
                  <div className='p-4 flex-1 flex flex-col'>
                    <h3 className='font-bold text-sm line-clamp-2 mb-2 h-10 leading-snug' title={decodeHtml(v.snippet.title)}>{decodeHtml(v.snippet.title)}</h3>
                    <div className='mt-auto'>
                      <button onClick={() => handleOpenTactiq(v.snippet.resourceId.videoId)} className={'w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ' + (copyStatus === v.snippet.resourceId.videoId ? 'bg-green-100 text-green-700' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm')}>
                        {copyStatus === v.snippet.resourceId.videoId ? <><Check size={14}/> 링크 복사됨!</> : <><ExternalLink size={14}/> Tactiq 자막 추출</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}