import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import './Gallery.css';

const IMAGES = [
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_133100_27b50ece-1bb3-4038-bcd6-e04b22539324_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC00991-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_133148_67288b61-b237-4d39-a77a-77344a73cdcc_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_134014_fb04fac6-65c1-4b1e-b4b7-00038e0f899c_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_135052_2ff8d91e-5b22-4c5c-ad98-0ab6c7ac3ff0_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_135140_2217ad17-27f2-47b4-a16b-8e0ff0076b01_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/hf_20260609_135231_be25d048-eb71-4d41-b033-84ba520ee6c3_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01111-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01131-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01141-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01156-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01161-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01171-HDR_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01188_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01189_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01191_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01193_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01199_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01200_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01209_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01214_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01221_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01223_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01226_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01228_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01232_ergebnis.webp",
  "https://pub-b33108412309406a9a941ddc51e9a5b9.r2.dev/hostel_neustadt/Gallerie/DSC01236_ergebnis.webp"
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
