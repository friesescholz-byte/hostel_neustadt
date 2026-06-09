import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import './Gallery.css';

const IMAGES = [
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00971-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01121-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00976-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01236_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01232_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00938-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00943-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00951-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00955-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00961-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00966-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00981-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00986-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00991-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC00996-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01011-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01016-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01021-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01041-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01046-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01056-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01061-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01066-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01071-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01076-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01081-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01096-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01101-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01111-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01126-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01131-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01136-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01141-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01146-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01151-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01156-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01161-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01166-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01171-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01176-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01181-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01186-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Bilder%20Hostel/DSC01240_ergebnis.webp"
];

const Gallery = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  const openLightbox = (index) => {
    setPhotoIndex(index);
    setImageLoading(true);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextPhoto = (e) => {
    if (e) e.stopPropagation();
    setImageLoading(true);
    setPhotoIndex((prev) => (prev + 1) % IMAGES.length);
  };

  const prevPhoto = (e) => {
    if (e) e.stopPropagation();
    setImageLoading(true);
    setPhotoIndex((prev) => (prev - 1 + IMAGES.length) % IMAGES.length);
  };

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Preload adjacent images for instant transition
  useEffect(() => {
    if (!isOpen) return;

    const preloadIndices = [
      (photoIndex + 1) % IMAGES.length,
      (photoIndex + 2) % IMAGES.length,
      (photoIndex - 1 + IMAGES.length) % IMAGES.length
    ];

    preloadIndices.forEach(idx => {
      const img = new Image();
      img.src = IMAGES[idx];
    });
  }, [photoIndex, isOpen]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!isOpen) return;
    const activeEl = document.querySelector('.thumb-item.active');
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [photoIndex, isOpen]);

  // Preview Grid Layout: 5 Images
  const previewImages = IMAGES.slice(0, 5);

  return (
    <section id="galerie" className="gallery-section section-padding">
      <div className="container">
        <div className="gallery-header">
          <span className="gallery-eyebrow">Einblicke</span>
          <h2 className="section-title text-left">Unser Hostel in Bildern</h2>
          <p className="gallery-desc">
            Mach dir selbst ein Bild von unseren modernen Zimmern, der voll ausgestatteten Küche und dem gemütlichen Ambiente.
          </p>
        </div>

        {/* Gallery Collage Grid */}
        <div className="gallery-grid">
          {previewImages.map((imgUrl, idx) => (
            <div 
              key={idx} 
              className={`gallery-item item-${idx}`}
              onClick={() => openLightbox(idx)}
            >
              <div 
                className="gallery-img" 
                style={{ backgroundImage: `url('${imgUrl}')` }}
                role="img"
                aria-label={`Galerie Bild ${idx + 1}`}
              />
              <div className="gallery-hover-overlay">
                <span>Ansehen</span>
              </div>
            </div>
          ))}

          {/* Show All Button Overlay */}
          <button className="btn-show-all" onClick={() => openLightbox(0)}>
            <Grid size={18} />
            <span>Alle {IMAGES.length} Fotos anzeigen</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            {/* Close button */}
            <button className="lightbox-close" onClick={closeLightbox} aria-label="Schließen">
              <X size={28} />
            </button>

            {/* Photo Counter */}
            <div className="lightbox-counter">
              {photoIndex + 1} / {IMAGES.length}
            </div>

            {/* Navigation Left */}
            <button className="lightbox-nav nav-left" onClick={prevPhoto} aria-label="Vorheriges Bild">
              <ChevronLeft size={36} />
            </button>

            {/* Active Image Container with Loading Spinner */}
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              {imageLoading && (
                <div className="lightbox-spinner">
                  <Loader2 size={40} className="animate-spin text-white opacity-75" />
                </div>
              )}
              <motion.img 
                key={photoIndex}
                src={IMAGES[photoIndex]} 
                alt={`Unterkunft Ansicht ${photoIndex + 1}`} 
                className="lightbox-image"
                onLoad={() => setImageLoading(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoading ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </div>

            {/* Navigation Right */}
            <button className="lightbox-nav nav-right" onClick={nextPhoto} aria-label="Nächstes Bild">
              <ChevronRight size={36} />
            </button>

            {/* Bottom Thumbnail Strip optimized with virtualized window rendering */}
            <div className="lightbox-thumbnails-wrap" onClick={(e) => e.stopPropagation()}>
              <div className="lightbox-thumbnails">
                {IMAGES.map((imgUrl, idx) => {
                  // Only render the thumbnail image if it is close to the active image
                  // This prevents loading all 40 full-size WebP images at the same time
                  const isNear = Math.abs(idx - photoIndex) <= 4;
                  return (
                    <div 
                      key={idx} 
                      className={`thumb-item ${idx === photoIndex ? 'active' : ''}`}
                      onClick={() => {
                        if (idx !== photoIndex) {
                          setImageLoading(true);
                          setPhotoIndex(idx);
                        }
                      }}
                    >
                      {isNear ? (
                        <img 
                          src={imgUrl} 
                          alt={`Miniaturansicht ${idx + 1}`}
                          loading="lazy"
                          className="thumb-img-element"
                        />
                      ) : (
                        <div className="thumb-placeholder" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;
