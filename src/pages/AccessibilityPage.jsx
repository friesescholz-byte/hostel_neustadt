import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Accessibility, CheckCircle2, Phone, Mail, ShieldCheck } from 'lucide-react';
import './LegalPage.css';

const AccessibilityPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: '#dbeafe', color: '#1e40af', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Accessibility size={28} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Inklusion & Barrierefreiheit
            </span>
          </div>

          <h1 className="legal-title">Erklärung zur Barrierefreiheit</h1>
          
          <div className="legal-content">
            <p>
              Die <strong>Eigentümergemeinschaft GbR Ahmed Bagari und Corinna Pasqualini</strong> ist bestrebt, ihr Unterkunftsangebot im <strong>Hostel Neustadt</strong> sowie ihren digitalen Webauftritt im Einklang mit den Bestimmungen des <strong>Barrierefreiheitsstärkungsgesetzes (BFSG)</strong>, der europäischen Richtlinie (EU) 2016/2102 sowie den Richtlinien für barrierefreie Webinhalte (WCAG 2.1 auf Konformitätsstufe AA) barrierefrei und uneingeschränkt zugänglich zu gestalten.
            </p>

            <h2>1. Physische Barrierefreiheit vor Ort im Hostel</h2>
            <p>
              Wir legen großen Wert darauf, dass Gäste mit Mobilitätseinschränkungen, Rollstuhlnutzer sowie Senioren einen komfortablen und unbeschwerten Aufenthalt bei uns genießen können:
            </p>
            <ul>
              <li>
                <strong>Barrierefreies Einzelzimmer (Zimmer 2):</strong> Unser Zimmer 2 ist speziell für bewegungseingeschränkte Personen und Rollstuhlnutzer konzipiert. Es verfügt über einen schwellenlosen, ebenerdigen Zugang, extra breite Türen und großzügige Bewegungsradien.
              </li>
              <li>
                <strong>Badezimmerausstattung:</strong> Bodengleiche, befahrbare Dusche ohne Einstiegskante, ergonomisch positionierte Haltegriffe an Dusche und WC sowie unterfahrbare Sanitäreinrichtungen.
              </li>
              <li>
                <strong>Zugang & Parken:</strong> Ebenerdiger Haupteingang und bequeme Parkmöglichkeiten in unmittelbarer Nähe zum Eingangsbereich (Bertha-Sicius-Str. 6, 31535 Neustadt am Rübenberge).
              </li>
              <li>
                <strong>Persönliche Unterstützung:</strong> Bei individuellen Assistenzwünschen oder Fragen vor der Anreise steht unser Team jederzeit telefonisch oder per WhatsApp zur Verfügung.
              </li>
            </ul>

            <h2>2. Stand der digitalen Barrierefreiheit unserer Website</h2>
            <p>
              Dieser Webauftritt (<a href="https://hostel-neustadt.de">www.hostel-neustadt.de</a>) wurde nach modernen Standards für Barrierefreiheit gestaltet und wird kontinuierlich optimiert:
            </p>
            <ul>
              <li>
                <strong>Visuelle Lesbarkeit & Kontraste:</strong> Strikte Einhaltung hoher Farbkontraste nach WCAG AA zwischen Text und Hintergrund für beste Lesbarkeit bei Sehschwächen oder wechselnden Lichtverhältnissen.
              </li>
              <li>
                <strong>Tastaturbedienbarkeit:</strong> Die gesamte Buchungsstrecke, Menüs und Formulare können ohne Maus ausschließlich über die Tastatur (Tab, Enter, Pfeiltasten) gesteuert werden; sichtbare Fokusindikatoren leiten den Nutzer verlässlich.
              </li>
              <li>
                <strong>Semantische HTML-Struktur & ARIA:</strong> Verlässliche Überschriftenhierarchien, Alternativtexte für informationstragende Bilder und ARIA-Attribute für Screenreader-Kompatibilität.
              </li>
              <li>
                <strong>Responsivität & Zoom:</strong> Die Seite unterstützt flexibles Skalieren und Vergrößern der Textinhalte bis 200 %, ohne dass horizontale Bildlaufleisten entstehen oder Inhalte abgeschnitten werden.
              </li>
              <li>
                <strong>Spam-Schutz ohne visuelle Hürden:</strong> Durch den Einsatz von Cloudflare Turnstile entfallen schwer lesbare Bild-Captchas oder unzugängliche Rätsel.
              </li>
            </ul>

            <h2>3. Erstellung und Überprüfung dieser Erklärung</h2>
            <p>
              Diese Erklärung wurde am <strong>8. Oktober 2026</strong> erstellt. Die Bewertung der Vereinbarkeit beruht auf einer fortlaufenden internen Selbstprüfung nach den Prüfkriterien des BITV- / WCAG-Tests.
            </p>

            <h2>4. Feedback & Kontakt bei Barrieren</h2>
            <p>
              Sind Ihnen auf unserer Website Barrieren aufgefallen? Haben Sie Anregungen oder benötigen Sie Informationen zu unseren barrierefreien Zimmern in einem alternativen Format? Wir freuen uns über Ihren Hinweis und helfen Ihnen gerne umgehend weiter:
            </p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginTop: '1rem', lineHeight: '1.8' }}>
              <strong>Eigentümergemeinschaft GbR Ahmed Bagari und Corinna Pasqualini</strong><br/>
              Bertha-Sicius-Str. 6<br/>
              31535 Neustadt am Rübenberge<br/>
              Telefon / WhatsApp: <a href="https://wa.me/491728572368" target="_blank" rel="noopener noreferrer">+49 172 8572368</a><br/>
              E-Mail: <a href="mailto:vermietung@bh-am-ruebenberge.de">vermietung@bh-am-ruebenberge.de</a>
            </div>

            <h2>5. Durchsetzungsverfahren</h2>
            <p>
              Sollten Sie nach Ihrer Kontaktaufnahme keine zufriedenstellende Antwort erhalten, können Sie sich an die zuständige Schlichtungsstelle für Barrierefreiheit wenden. Diese Schlichtungsverfahren sind für Bürgerinnen und Bürger kostenlos:
            </p>
            <p>
              <strong>Schlichtungsstelle nach dem Behindertengleichstellungsgesetz bei der Landesbeauftragten für Menschen mit Behinderungen Niedersachsen</strong><br/>
              Hannah-Arendt-Platz 2<br/>
              30159 Hannover<br/>
              Website: <a href="https://www.ms.niedersachsen.de" target="_blank" rel="noopener noreferrer">www.ms.niedersachsen.de</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccessibilityPage;
