import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShieldCheck, AlertCircle, Calendar, CheckCircle2, Clock, Ban } from 'lucide-react';
import './LegalPage.css';

const TermsPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <h1 className="legal-title">Allgemeine Geschäftsbedingungen (AGB) & Stornierungsbedingungen</h1>
          <p className="legal-intro-note">
            Stand: Oktober 2026 · Hostel Neustadt, Bahnhofstraße 10, 31535 Neustadt am Rübenberge
          </p>

          {/* Quick Summary Highlights for Guests */}
          <div className="legal-summary-box">
            <div className="legal-summary-item">
              <Clock size={20} className="text-primary" />
              <div>
                <strong>Check-In & Check-Out:</strong>
                <p>Anreise ab 15:00 Uhr · Abreise bis 11:00 Uhr.</p>
              </div>
            </div>

            <div className="legal-summary-item">
              <Calendar size={20} className="text-primary" />
              <div>
                <strong>Kostenfreie Stornierung:</strong>
                <p>Reguläre Buchungen bis 7 Tage vor Anreise zu 100% kostenfrei stornierbar.</p>
              </div>
            </div>

            <div className="legal-summary-item">
              <Ban size={20} className="text-primary" />
              <div>
                <strong>Gesetzliches Widerrufsrecht:</strong>
                <p>Gemäß § 312g Abs. 2 Nr. 9 BGB besteht bei Hotel- und Übernachtungsbuchungen kein gesetzliches 14-tägiges Widerrufsrecht.</p>
              </div>
            </div>
          </div>

          <div className="legal-content">
            <h2>Teil I: Besondere Belehrung zum Widerrufsrecht</h2>
            
            <div className="legal-callout warning">
              <h3>Ausschluss des gesetzlichen Widerrufsrechts (§ 312g Abs. 2 Nr. 9 BGB)</h3>
              <p>
                Wir weisen ausdrücklich darauf hin, dass bei Verträgen über die Erbringung von Dienstleistungen im Zusammenhang mit der Beherbergung zu anderen Zwecken als zu Wohnzwecken, wenn der Vertrag für die Erbringung einen spezifischen Termin oder Zeitraum vorsieht, <strong>gemäß § 312g Abs. 2 Nr. 9 BGB kein gesetzliches Widerrufsrecht</strong> für Verbraucher besteht.
              </p>
              <p>
                Auch bei Buchungen über das Internet (Fernabsatz) steht dem Gast somit kein 14-tägiges gesetzliches Widerrufsrecht zu. Jede Buchung ist nach unserer Bestätigung verbindlich. Anstelle des gesetzlichen Widerrufsrechts gelten unsere nachfolgenden vertraglichen Stornierungsbedingungen.
              </p>
            </div>

            <h2>Teil II: Vertragliche Stornierungsbedingungen & Rücktritt des Gastes</h2>
            <p>
              Ein Rücktritt des Gastes von dem mit dem Hostel Neustadt geschlossenen Beherbergungsvertrag bedarf der Textform (z. B. per E-Mail an <code>info@hostel-neustadt.de</code>). 
              Erfolgt die Stornierung nicht innerhalb der nachfolgenden Fristen, bleibt der Anspruch des Hostels auf die vereinbarte Vergütung gemäß § 537 BGB unter Anrechnung ersparter Aufwendungen bestehen.
            </p>

            <h3>1. Reguläre Stornierungsstaffel (Standardtarife)</h3>
            <ul>
              <li><strong>Bis 7 Tage vor dem Anreisetag:</strong> Kostenfrei. Bereits geleistete Zahlungen werden vollständig erstattet.</li>
              <li><strong>6 bis 2 Tage vor dem Anreisetag:</strong> Stornogebühr in Höhe von <strong>50 %</strong> des gebuchten Gesamtbetrags.</li>
              <li><strong>Weniger als 48 Stunden vor dem Anreisetag oder bei Nichtanreise (No-Show):</strong> Stornogebühr in Höhe von <strong>80 %</strong> des Gesamtbetrags. (Hierbei werden 20 % als ersparte Aufwendungen des Hostels für reine Übernachtungsleistungen in Abzug gebracht).</li>
            </ul>

            <h3>2. Sonderkonditionen zu Messezeiten & Großevents</h3>
            <p>
              Für Buchungen, die in gesondert ausgewiesene Messe- oder Eventzeiträume (z. B. Hannover Messe, Großveranstaltungen) fallen, gelten aufgrund der hohen Vorreservierungsbindung folgende Konditionen:
            </p>
            <ul>
              <li><strong>Bis 14 Tage vor Anreise:</strong> Kostenfreie Stornierung möglich.</li>
              <li><strong>Ab 13 Tage vor Anreise bis zum Anreisetag:</strong> 80 % des Gesamtpreises.</li>
            </ul>
            <p>
              <em>Dem Gast bleibt in allen Fällen der Nachweis unbenommen, dass dem Hostel überhaupt kein Schaden oder ein wesentlich niedrigerer Schaden als die geltend gemachte Pauschale entstanden ist.</em>
            </p>

            <h2>Teil III: Allgemeine Geschäftsbedingungen für den Beherbergungsvertrag</h2>

            <h3>§ 1 Geltungsbereich & Vertragspartner</h3>
            <p>
              (1) Diese Geschäftsbedingungen gelten für Verträge über die mietweise Überlassung von Hostel- und Hotelzimmern zur Beherbergung sowie alle für den Gast erbrachten weiteren Leistungen des Hostels Neustadt (nachfolgend „Hostel“).<br />
              (2) Vertragspartner ist das Hostel Neustadt, Bahnhofstraße 10, 31535 Neustadt am Rübenberge.
            </p>

            <h3>§ 2 Vertragsschluss & Zahlung</h3>
            <p>
              (1) Mit der Online-Buchung über unsere Website gibt der Gast ein verbindliches Angebot zum Abschluss eines Beherbergungsvertrages ab. Der Vertrag kommt mit der Buchungsbestätigung und der erfolgreichen Zahlungsabwicklung zustande.<br />
              (2) Die Zahlung erfolgt im Voraus über die angebotenen Zahlungsarten unseres Zahlungsdienstleisters (z. B. Mollie: Kreditkarte, PayPal, Klarna/Sofortüberweisung, Giropay). Nach Zahlungseingang wird dem Gast unverzüglich eine Buchungsbestätigung sowie eine ordnungsgemäße Rechnung im PDF-Format zur Verfügung gestellt.<br />
              (3) Alle angegebenen Preise verstehen sich in Euro (€) inklusive der jeweils gültigen gesetzlichen Mehrwertsteuer (derzeit 7 % für Beherbergungsleistungen gem. § 12 Abs. 2 Nr. 11 UStG).
            </p>

            <h3>§ 3 Zimmerbereitstellung, An- und Abreise</h3>
            <p>
              (1) Gebuchte Zimmer stehen dem Gast am Anreisetag ab <strong>15:00 Uhr</strong> zur Verfügung. Ein Anspruch auf frühere Bereitstellung besteht nicht, es sei denn, dies wurde ausdrücklich vereinbart.<br />
              (2) Am vereinbarten Abreisetag sind die Zimmer dem Hostel spätestens um <strong>11:00 Uhr</strong> geräumt zur Verfügung zu stellen. Bei verspäteter Räumung kann das Hostel für die vertragswidrige Nutzung bis 18:00 Uhr 50 % des vollen Logispreises, ab 18:00 Uhr 100 % in Rechnung stellen.<br />
              (3) Der Zugang zum Gebäude und zu den Zimmern erfolgt schlüssellos über ein modernes elektronisches Zugangssystem oder Schlüsselcode. Die Zugangsdaten erhält der Gast rechtzeitig vor Anreise per E-Mail.
            </p>

            <h3>§ 4 Rücktritt des Hostels</h3>
            <p>
              Das Hostel ist berechtigt, aus sachlich gerechtfertigtem Grund vom Vertrag zurückzutreten, insbesondere falls:
            </p>
            <ul>
              <li>Höhere Gewalt oder andere vom Hostel nicht zu vertretende Umstände die Erfüllung des Vertrages unmöglich machen;</li>
              <li>Zimmer unter irreführender oder falscher Angabe wesentlicher Tatsachen (z. B. zur Identität des Gastes oder zum Aufenthaltszweck) gebucht wurden;</li>
              <li>das Hostel begründeten Anlass zu der Annahme hat, dass die Inanspruchnahme der Beherbergungsleistung den reibungslosen Geschäftsbetrieb, die Sicherheit oder das Ansehen des Hostels in der Öffentlichkeit gefährden kann.</li>
            </ul>

            <h3>§ 5 Hausordnung, Nichtraucherschutz & Tierhaltung</h3>
            <p>
              (1) Im gesamten Gebäude und in allen Zimmern des Hostels gilt ein <strong>striktestes Rauchverbot</strong>. Bei Zuwiderhandlung wird eine Sonderreinigungsgebühr in Höhe von mindestens 150,00 € sowie eventuelle Kosten für Feuerwehreinsätze durch ausgelöste Brandmelder in Rechnung gestellt.<br />
              (2) Das Mitbringen von Haustieren ist nur nach vorheriger schriftlicher Zustimmung des Hostels und gegen gesonderte Gebühr gestattet.<br />
              (3) Zwischen 22:00 Uhr und 06:00 Uhr gilt im gesamten Haus Nachtruhe aus Rücksicht auf alle Gäste und Nachbarn.
            </p>

            <h3>§ 6 Haftung des Hostels</h3>
            <p>
              (1) Das Hostel haftet für seine Verpflichtungen aus dem Vertrag nach den gesetzlichen Bestimmungen. Für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit haftet das Hostel unbeschränkt. Für sonstige Schäden haftet das Hostel nur bei Vorsatz oder grober Fahrlässigkeit.<br />
              (2) Für eingebrachte Sachen des Gastes haftet das Hostel nach den gesetzlichen Bestimmungen der §§ 701 ff. BGB.
            </p>

            <h3>§ 7 Schlussbestimmungen</h3>
            <p>
              (1) Änderungen oder Ergänzungen des Vertrages bedürfen der Textform.<br />
              (2) Es gilt das Recht der Bundesrepublik Deutschland.<br />
              (3) Erfüllungs- und Zahlungsort sowie ausschließlicher Gerichtsstand ist – soweit gesetzlich zulässig – Neustadt am Rübenberge / Hannover.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsPage;
