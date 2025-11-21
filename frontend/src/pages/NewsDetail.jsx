import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import NewsMap from '../components/NewsMap';

const NewsDetail = () => {
  const { id } = useParams();
  const [news, setNews] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const newsData = await api.get(`/news/${id}`);
        const commentsData = await api.get(`/comments/${id}`);
        setNews(newsData);
        setComments(commentsData);
        setLikesCount(newsData.likes ? newsData.likes.length : 0);
        if (token) {
          try {
            const userData = await api.get('/users/profile', token);
            setUser(userData);
            // Check if user liked this news
            setIsLiked(newsData.likes ? newsData.likes.some(like => like._id === userData._id) : false);
          } catch (profileError) {
            // If profile fetch fails, clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.dispatchEvent(new Event('authChange'));
            window.location.href = '/login';
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post('/comments', { newsId: id, content: newComment }, token);
      // Fetch comments again to get updated list with populated author
      const commentsData = await api.get(`/comments/${id}`);
      setComments(commentsData);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
        // Token invalid, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.dispatchEvent(new Event('authChange'));
        window.location.href = '/login';
      } else {
        alert('Có lỗi khi gửi bình luận. Vui lòng thử lại.');
      }
    }
  };

  const handleReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyContent('');
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    try {
      await api.post('/comments', { newsId: id, content: replyContent, parentId }, token);
      const commentsData = await api.get(`/comments/${id}`);
      setComments(commentsData);
      setReplyingTo(null);
      setReplyContent('');
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Có lỗi khi gửi trả lời. Vui lòng thử lại.');
    }
  };

  const buildNestedComments = (comments, parentId = null) => {
    return comments
      .filter(comment => (comment.parentId ? comment.parentId._id : null) === parentId)
      .map(comment => ({
        ...comment,
        replies: buildNestedComments(comments, comment._id),
        level: parentId ? 1 : 0  // Tất cả replies đều level 1, gốc level 0
      }));
  };

  const renderComment = (comment) => {
    const authorName = typeof comment.author === 'object' ? comment.author.username : 'Người dùng';
    const initials = authorName.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
    const time = comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '';

    return (
      <div key={comment._id} className={`${comment.level === 0 ? 'bg-gray-100 p-4 rounded mb-3' : 'bg-gray-50 p-3 rounded mb-2'}`} style={comment.level > 0 ? { marginLeft: '16px' } : {}}>
        <div className="flex gap-3">
          <div className="shrink-0">
            {/* Show avatar image if available, otherwise show initials */}
            {comment.author && (typeof comment.author === 'object') && comment.author.avatar ? (
              <img
                src={comment.author.avatar}
                alt={authorName}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = '/assets/default-avatar.png'; }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm">{initials}</div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-semibold text-gray-800">{authorName}</div>
                <div className="text-xs text-gray-500">{time}</div>
                {comment.parentId && (
                  <div className="text-xs text-blue-600 mt-1">Trả lời @{typeof comment.parentId.author === 'object' ? comment.parentId.author.username : 'người dùng'}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canEditOrDelete(comment) && (
                  <>
                    <button onClick={() => handleEdit(comment)} className="bg-yellow-400 text-white px-2 py-1 rounded text-xs transform transition duration-150 hover:scale-105 hover:brightness-95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-300">Sửa</button>
                    <button onClick={() => handleDelete(comment._id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs transform transition duration-150 hover:scale-105 hover:bg-red-700 hover:shadow-md">Xóa</button>
                  </>
                )}
              </div>
            </div>

            {editingComment === comment._id ? (
              <div className="mt-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  rows="3"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="bg-blue-500 text-white px-3 py-1 rounded">Lưu</button>
                  <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded">Hủy</button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-3 text-gray-800 whitespace-pre-wrap">{comment.content}</p>
                <div className="mt-3 flex items-center gap-3">
                  {token && (
                    <button onClick={() => handleReply(comment._id)} className="text-sm text-blue-600 hover:underline">Trả lời</button>
                  )}
                </div>
              </>
            )}

            {replyingTo === comment._id && (
              <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="mt-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Trả lời ${authorName}...`}
                  className="w-full p-2 border rounded"
                  rows="2"
                  required
                />
                <div className="mt-2 flex gap-2">
                  <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded text-sm">Gửi</button>
                  <button type="button" onClick={() => setReplyingTo(null)} className="bg-gray-500 text-white px-3 py-1 rounded text-sm">Hủy</button>
                </div>
              </form>
            )}

            {comment.replies && comment.replies.map(renderComment)}
          </div>
        </div>
      </div>
    );
  };

  const handleEdit = (comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/comments/${editingComment}`, { content: editContent }, token);
      setComments(comments.map(c => c._id === editingComment ? { ...c, content: editContent } : c));
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.dispatchEvent(new Event('authChange'));
        window.location.href = '/login';
      } else {
        alert('Lỗi khi cập nhật bình luận');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleDelete = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      await api.delete(`/comments/${commentToDelete}`, token);
      setComments(comments.filter(c => c._id !== commentToDelete));
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (error.message.includes('400') || error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.dispatchEvent(new Event('authChange'));
        window.location.href = '/login';
      } else {
        alert('Lỗi khi xóa bình luận');
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setCommentToDelete(null);
  };

  const handleLike = async () => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    try {
      const response = await api.likeNews(id, token);
      setIsLiked(response.liked);
      setLikesCount(response.likesCount);
    } catch (error) {
      console.error('Error liking news:', error);
      alert('Có lỗi khi thích tin tức. Vui lòng thử lại.');
    }
  };

  // When modal is open, prevent background scroll and disable map interactions
  useEffect(() => {
    if (showDeleteConfirm) {
      // prevent body scroll
      document.body.style.overflow = 'hidden';
      // disable leaflet interactions so map can't float above modal or respond to scroll
      document.querySelectorAll('.leaflet-container').forEach(el => {
        el.style.pointerEvents = 'none';
      });
    } else {
      document.body.style.overflow = '';
      document.querySelectorAll('.leaflet-container').forEach(el => {
        el.style.pointerEvents = '';
      });
    }

    return () => {
      document.body.style.overflow = '';
      document.querySelectorAll('.leaflet-container').forEach(el => {
        el.style.pointerEvents = '';
      });
    };
  }, [showDeleteConfirm]);

  const canEditOrDelete = (comment) => {
    if (!user) return false;
    const authorId = typeof comment.author === 'object' ? comment.author._id : comment.author;
    return authorId === user._id || ['admin', 'editor'].includes(user.role);
  };

  if (loading) return <p className="text-center p-4">Đang tải...</p>;
  if (!news) return <p className="text-center p-4">Không tìm thấy tin tức</p>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">{news.title}</h1>
      
      {/* Summary */}
      {news.summary && (
        <p className="text-xl text-gray-600 mb-6 italic">{news.summary}</p>
      )}
      
      {/* Images */}
      {news.images && news.images.length > 0 && (
        <div className="mb-8">
          {news.images.length === 1 ? (
            <img 
              src={news.images[0]} 
              alt={news.title} 
              className="w-full max-w-4xl mx-auto rounded-lg shadow-lg" 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {news.images.map((image, index) => (
                <img 
                  key={index}
                  src={image} 
                  alt={`${news.title} - ${index + 1}`} 
                  className="w-full h-64 object-cover rounded-lg shadow-md" 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video */}
      {news.videoUrl && (
        <div className="mb-8">
          <iframe
            src={`https://www.youtube.com/embed/${news.videoUrl.split('v=')[1]}`}
            title={news.title}
            className="w-full max-w-4xl mx-auto h-96 rounded-lg shadow-lg"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      )}
      
  <div className="news-content text-gray-700 mb-6 leading-relaxed whitespace-pre-wrap" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: news.content }} />
      
      {/* Like Button */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
            isLiked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span>{isLiked ? 'Đã thích' : 'Thích'}</span>
        </button>
        <span className="text-gray-600">{likesCount} lượt thích</span>
      </div>
      
      {news.location && <NewsMap location={news.location} />}
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Bình Luận</h3>
        {buildNestedComments(comments).map(renderComment)}
        {token && (
          <form onSubmit={handleCommentSubmit} className="mt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Thêm bình luận..."
              className="w-full p-2 border rounded"
              rows="3"
              required
            />
            <button type="submit" className="mt-2 bg-green-600 text-white p-3 rounded text-lg">Gửi Bình Luận</button>
          </form>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)', zIndex: 99999 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4" style={{ zIndex: 100000 }}>
            <h3 className="text-lg font-semibold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition transform duration-150 hover:scale-105"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsDetail;