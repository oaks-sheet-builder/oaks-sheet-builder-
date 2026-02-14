import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import html2canvas from 'html2canvas';
import './GangSheetBuilder.css';

function GangSheetBuilder() {
  const [designs, setDesigns] = useState([]);
  const [selectedSize, setSelectedSize] = useState('29x50');
  const [productInfo, setProductInfo] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const canvasRef = useRef(null);

  const SIZES = {
    '29x50': { width: 290, height: 500, price: 20 },
    '29x100': { width: 290, height: 1000, price: 30 }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setProductInfo({
      productId: params.get('product_id') || 'test-product',
      productName: params.get('product_name') || 'Gang Sheet',
      price: params.get('price') || '20',
      storeId: params.get('store') || 'test-store'
    });
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or SVG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const newDesign = {
          id: `design-${Date.now()}`,
          src: event.target.result,
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          originalWidth: img.width,
          originalHeight: img.height,
          fileName: file.name
        };
        setDesigns([...designs, newDesign]);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const updateDesign = (id, updates) => {
    setDesigns(designs.map(design => 
      design.id === id ? { ...design, ...updates } : design
    ));
  };

  const deleteDesign = (id) => {
    setDesigns(designs.filter(design => design.id !== id));
    setSelectedDesign(null);
  };

  const duplicateDesign = (id) => {
    const design = designs.find(d => d.id === id);
    if (design) {
      const newDesign = {
        ...design,
        id: `design-${Date.now()}`,
        x: design.x + 20,
        y: design.y + 20
      };
      setDesigns([...designs, newDesign]);
    }
  };

  const clearAllDesigns = () => {
    if (window.confirm('Are you sure you want to remove all designs?')) {
      setDesigns([]);
      setSelectedDesign(null);
    }
  };

  const saveDesign = async () => {
    if (designs.length === 0) {
      alert('Please add at least one design to your gang sheet');
      return;
    }

    try {
      const saveButton = document.querySelector('.btn-save');
      const originalText = saveButton.innerHTML;
      saveButton.innerHTML = '💾 Saving...';
      saveButton.disabled = true;

      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      const imageData = canvas.toDataURL('image/png');
      const designId = `OB-${Date.now()}`;
      
      setTimeout(() => {
        alert(`✅ Design saved successfully!\n\nDesign ID: ${designId}\n\nIn production, this would add to your cart.`);
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
      }, 1000);

    } catch (error) {
      console.error('Error saving design:', error);
      alert('❌ Failed to save design. Please try again.');
      
      const saveButton = document.querySelector('.btn-save');
      saveButton.innerHTML = '💾 Save & Add to Cart';
      saveButton.disabled = false;
    }
  };

  const canvasSize = SIZES[selectedSize];

  return (
    <div className="gang-sheet-builder">
      <header className="builder-header">
        <div className="header-content">
          <div className="brand">
            <h1>🌳 Oak's Sheet Builder</h1>
            <p className="tagline">Powered by Oak's Blanks</p>
          </div>
          <div className="product-info">
            <span className="product-name">{productInfo?.productName}</span>
            <span className="product-price">${SIZES[selectedSize].price} AUD</span>
          </div>
        </div>
      </header>

      <div className="builder-controls">
        <div className="control-group">
          <label>📏 Sheet Size:</label>
          <select 
            value={selectedSize} 
            onChange={(e) => setSelectedSize(e.target.value)}
            className="size-select"
          >
            <option value="29x50">29cm × 50cm - ${SIZES['29x50'].price} AUD</option>
            <option value="29x100">29cm × 100cm - ${SIZES['29x100'].price} AUD</option>
          </select>
        </div>

        <div className="control-group">
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={handleFileUpload}
            id="file-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="btn btn-upload">
            📁 Upload Design
          </label>
        </div>

        <div className="control-group">
          <span className="design-count">
            <strong>{designs.length}</strong> {designs.length === 1 ? 'Design' : 'Designs'}
          </span>
          {designs.length > 0 && (
            <button 
              className="btn btn-clear"
              onClick={clearAllDesigns}
              title="Clear all designs"
            >
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      <div className="builder-workspace">
        <div className="canvas-container">
          <div 
            ref={canvasRef}
            className="gang-sheet-canvas"
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`
            }}
            onClick={() => setSelectedDesign(null)}
          >
            {designs.length === 0 && (
              <div className="empty-canvas">
                <div className="empty-canvas-content">
                  <p className="empty-icon">📐</p>
                  <p className="empty-text">Upload your first design to get started</p>
                  <p className="empty-hint">Drag and drop or click "Upload Design"</p>
                </div>
              </div>
            )}

            {designs.map((design) => (
              <Rnd
                key={design.id}
                position={{ x: design.x, y: design.y }}
                size={{ width: design.width, height: design.height }}
                onDragStop={(e, d) => {
                  updateDesign(design.id, { x: d.x, y: d.y });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateDesign(design.id, {
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                    ...position
                  });
                }}
                bounds="parent"
                minWidth={50}
                minHeight={50}
                className={`design-item ${selectedDesign === design.id ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDesign(design.id);
                }}
              >
                <img 
                  src={design.src} 
                  alt={design.fileName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                  draggable={false}
                />
                
                {selectedDesign === design.id && (
                  <div className="design-controls">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateDesign(design.id);
                      }}
                      className="btn-icon"
                      title="Duplicate design"
                    >
                      📋
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDesign(design.id);
                      }}
                      className="btn-icon btn-delete"
                      title="Delete design"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </Rnd>
            ))}
          </div>
          
          <div className="canvas-info">
            <div className="info-row">
              <span>📐 Canvas: {canvasSize.width}mm × {canvasSize.height}mm</span>
              <span>🎨 Designs: {designs.length}</span>
            </div>
            {selectedDesign && (
              <div className="selected-info">
                Selected: Click and drag to move • Drag corners to resize
              </div>
            )}
          </div>
        </div>

        <div className="sidebar">
          <div className="sidebar-section">
            <h3>📋 Instructions</h3>
            <ol>
              <li>Select your gang sheet size</li>
              <li>Upload your design images (PNG, JPG, SVG)</li>
              <li>Click and drag to position designs</li>
              <li>Drag corners to resize designs</li>
              <li>Click "Save & Add to Cart" when done</li>
            </ol>
          </div>

          <div className="sidebar-section tips">
            <h4>💡 Pro Tips</h4>
            <ul>
              <li><strong>File Format:</strong> Use PNG with transparent backgrounds for best results</li>
              <li><strong>Resolution:</strong> Higher resolution = better print quality</li>
              <li><strong>Spacing:</strong> Leave space between designs for cutting</li>
              <li><strong>Selection:</strong> Click a design to select and edit it</li>
              <li><strong>Duplicate:</strong> Use the copy button to add multiple copies</li>
            </ul>
          </div>

          <div className="sidebar-section support">
            <h4>❓ Need Help?</h4>
            <p>Contact Oak's Blanks support for assistance with your gang sheet design.</p>
          </div>
        </div>
      </div>

      <footer className="builder-footer">
        <div className="footer-left">
          <span className="footer-brand">🌳 Oak's Blanks</span>
        </div>
        <div className="footer-right">
          <button 
            className="btn btn-secondary"
            onClick={() => {
              if (designs.length > 0) {
                if (window.confirm('Are you sure? Your design will not be saved.')) {
                  window.close();
                }
              } else {
                window.close();
              }
            }}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary btn-save"
            onClick={saveDesign}
            disabled={designs.length === 0}
          >
            💾 Save & Add to Cart
          </button>
        </div>
      </footer>
    </div>
  );
}

export default GangSheetBuilder;