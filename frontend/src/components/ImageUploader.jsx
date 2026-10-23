import { useState, useCallback, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function ImageUploader({
  images = [],
  onChange,
  max = 8,
  label = "images",
  showMainLabel = false,
  folder = "zaevyul/media",
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const addFiles = useCallback(async (files) => {
    const validFiles = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, max - images.length);

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = validFiles.map(async (f) => {
        const res = await api.upload.image(f, folder);
        if (res && res.url) {
          return {
            id: res.public_id || `${f.name}-${Date.now()}`,
            url: res.url,
            name: f.name,
            cloudinary: true,
          };
        }
        throw new Error("Upload did not return a valid URL.");
      });

      const uploadedImgs = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedImgs]);
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setUploading(false);
    }
  }, [images, onChange, max, folder]);

  const remove = (id) => onChange(images.filter(img => (img.id || img.url) !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {images.length < max && (
        <div
          className={`image-drop-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (!uploading) addFiles(e.dataTransfer.files); }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={max > 1}
            style={{ display: 'none' }}
            onChange={(e) => addFiles(e.target.files)}
          />
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 0' }}>
              <Loader2 className="animate-spin" size={22} style={{ color: 'var(--color-walnut)' }} />
              <p style={{ fontSize: 12, color: 'var(--color-walnut)', fontWeight: 500 }}>Uploading to Cloudinary...</p>
            </div>
          ) : (
            <>
              <Upload size={18} style={{ color: 'var(--color-river-stone)', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Drop {label} here or <span style={{ color: 'var(--color-walnut)', textDecoration: 'underline', cursor: 'pointer' }}>browse</span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-text-caption)', marginTop: 4 }}>
                Up to {max} {max === 1 ? 'file' : 'files'} · Uploads directly to Cloudinary
              </p>
            </>
          )}
        </div>
      )}
      {images.length > 0 && (
        <div className="image-grid">
          {images.map((img, idx) => {
            const imgUrl = typeof img === 'string' ? img : (img.url || img.src);
            const imgId = img.id || img.public_id || imgUrl;
            return (
              <div key={imgId} className="image-thumb" title={img.name || 'Image'}>
                {imgUrl ? (
                  <img src={imgUrl} alt={img.name || 'Product Image'} />
                ) : (
                  <div className="flex-center" style={{ width: '100%', height: '100%' }}>
                    <ImageIcon size={20} style={{ color: 'var(--color-river-stone)' }} />
                  </div>
                )}
                {showMainLabel && idx === 0 && (
                  <div style={{ position: 'absolute', top: 4, left: 4, background: 'var(--color-walnut)', color: 'white', fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 2, letterSpacing: '0.05em' }}>
                    MAIN
                  </div>
                )}
                <div className="image-thumb-actions">
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(imgId); }}
                    style={{ background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: 3, padding: 4, cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
