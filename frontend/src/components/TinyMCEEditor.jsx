import { Editor } from '@tinymce/tinymce-react';
import { useTheme } from '../contexts/ThemeContext';

const TinyMCEEditor = ({ value, onChange, height = 400 }) => {
  const { theme } = useTheme();
  const token = localStorage.getItem('token');

  const handleEditorChange = (content) => {
    onChange(content);
  };

  const handleImageUpload = async (blobInfo, success, failure) => {
    try {
      const formData = new FormData();
      formData.append('image', blobInfo.blob(), blobInfo.filename());

      const response = await fetch('http://localhost:5000/api/news/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      if (!data.imageUrl) {
        throw new Error('Invalid response');
      }
      success(data.imageUrl);
    } catch (error) {
      console.error('Image upload error:', error);
      failure('Upload failed');
    }
  };

  // Theme-specific editor content styles
  const lightContentStyle = `
    body { background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; line-height:1.6; padding: 12px; }
    p { margin: 0 0 1rem 0; }
    h1,h2,h3,h4,h5,h6 { margin: 1.5rem 0 1rem 0; font-weight:600; }
    ul, ol { margin: 1rem 0; padding-left: 2rem; }
    blockquote { border-left: 4px solid #e5e7eb; padding-left:1rem; margin:1rem 0; font-style: italic; color: #94a3b8 }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    table td, table th { border: 1px solid #e5e7eb; padding: 8px; }
    table th { background-color: #f5f5f5; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before { color: #888; font-style: italic; }
  `;

  const darkContentStyle = `
    body { background: #0b1220; color: #e6eef8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size:14px; line-height:1.6; padding:12px; }
    p { margin: 0 0 1rem 0; }
    h1,h2,h3,h4,h5,h6 { margin: 1.5rem 0 1rem 0; font-weight:600; color: #e6eef8 }
    ul, ol { margin: 1rem 0; padding-left: 2rem; }
    blockquote { border-left: 4px solid #20313f; padding-left:1rem; margin:1rem 0; font-style: italic; color: #9ca3af }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    table td, table th { border: 1px solid #1f2a37; padding: 8px; }
    table th { background-color: #0f1724; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before { color: #94a3af; font-style: italic; }
  `;

  const init = {
    height: height,
    menubar: false,
    onboarding: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount',
      'emoticons'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic underline strikethrough | ' +
      'alignleft aligncenter alignright alignjustify | ' +
      'bullist numlist outdent indent | ' +
      'link image media table | ' +
      'code codesample | emoticons charmap | ' +
      'removeformat fullscreen preview help',
    content_style: theme === 'dark' ? darkContentStyle : lightContentStyle,
    placeholder: 'Nhập nội dung tin tức...',
    images_upload_handler: handleImageUpload,
    automatic_uploads: true,
    file_picker_types: 'image',
    paste_data_images: true,
    image_advtab: true,
    image_title: true,
    image_caption: true,
    image_description: false,
    table_default_attributes: {
      border: '1',
      cellpadding: '0',
      cellspacing: '0',
      width: '100%',
      style: 'border-collapse: collapse;'
    },
    table_default_styles: {
      width: '100%',
      'border-collapse': 'collapse'
    },
    contextmenu: 'link image table configurepermanentpen',
    directionality: 'ltr',
    branding: false,
    elementpath: false,
    statusbar: false,
    resize: false,
    skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
    content_css: false,
    setup: (editor) => {
      editor.on('init', () => {
        // small console log to help debugging if needed
        // console.log('TinyMCE initialized with theme:', theme);
      });
    }
  };

  // Force remount on theme change so skin/content_style refresh
  return (
    <Editor
      key={theme}
      apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
      value={value}
      onEditorChange={handleEditorChange}
      init={init}
    />
  );
};

export default TinyMCEEditor;