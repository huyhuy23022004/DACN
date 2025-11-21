import { useEffect, useRef, useState } from 'react';

// Extract YouTube video id from common URL formats
function extractYouTubeId(urlOrId) {
  if (!urlOrId) return null;
  // If it's already an id (no slashes or ?), return it
  if (!urlOrId.includes('youtube') && !urlOrId.includes('youtu.be') && !urlOrId.includes('/')) {
    return urlOrId;
  }
  try {
    const u = new URL(urlOrId);
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1);
    }
    if (u.searchParams.has('v')) return u.searchParams.get('v');
    // Embed URL
    const parts = u.pathname.split('/');
    return parts.pop() || parts.pop();
  } catch (e) {
    // Fallback regex
    const m = urlOrId.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    return m ? m[1] : null;
  }
}

const YouTubeEmbed = ({ videoUrl, title = 'YouTube video', className = 'w-full h-64', playerVars = '' }) => {
  const id = extractYouTubeId(videoUrl);
  const iframeRef = useRef(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const el = iframeRef.current;
    if (!el) return;

    const handleLoad = () => setReady(true);
    el.addEventListener('load', handleLoad);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            // Pause the video when it's out of view
            try {
              if (el && el.contentWindow) {
                el.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
              }
            } catch (err) {
              // ignore
            }
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      el.removeEventListener('load', handleLoad);
    };
  }, [id]);

  if (!id) return null;

  // Ensure enablejsapi=1 is present so postMessage commands work
  const src = `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0&${playerVars}`;

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      className={className}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    ></iframe>
  );
};

export default YouTubeEmbed;
