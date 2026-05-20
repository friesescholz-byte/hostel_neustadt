import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LegalPage.css';

const PrivacyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <h1 className="legal-title">Datenschutzerklärung</h1>
          
          <div className="legal-content">
            <h2>1. Datenschutz auf einen Blick</h2>
            <p>Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Nachfolgend informieren wir Sie darüber, welche personenbezogenen Daten wir beim Besuch unserer Website, bei der Kontaktaufnahme, bei der Nutzung unseres Online-Buchungssystems sowie im Zusammenhang mit eingebundenen Diensten wie Google Maps, Google Analytics und Social-Media-Verlinkungen verarbeiten.</p>
            <p>Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können, zum Beispiel Name, Adresse, E-Mail-Adresse, Telefonnummer, IP-Adresse oder Buchungsdaten.</p>
            <p>Diese Datenschutzerklärung gilt für die Website:<br/><strong>hostel-neustadt.de</strong> (oder entsprechende URL)</p>

            <h2>2. Verantwortlicher</h2>
            <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
            <p>
              Hostel Neustadt<br/>
              Musterstraße 1<br/>
              31535 Neustadt am Rübenberge<br/>
              Deutschland
            </p>
            <p>
              Telefon: +49 123 456789<br/>
              E-Mail: kontakt@hostel-neustadt.de<br/>
              Website: www.hostel-neustadt.de
            </p>
            <p>Vertreten durch: Max Mustermann</p>

            <h2>3. Datenschutzbeauftragter</h2>
            <p>Wir sind gesetzlich nicht verpflichtet, einen Datenschutzbeauftragten zu bestellen.</p>

            <h2>4. Allgemeine Hinweise zur Datenverarbeitung</h2>
            <p>Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung unserer Website, zur Bearbeitung von Anfragen, zur Durchführung von Buchungen, zur Erfüllung vertraglicher oder gesetzlicher Pflichten oder auf Grundlage Ihrer Einwilligung erforderlich ist.</p>
            <p>Die Verarbeitung erfolgt insbesondere auf Grundlage folgender Rechtsgrundlagen:</p>
            <ul>
              <li>Art. 6 Abs. 1 lit. a DSGVO, wenn Sie uns eine Einwilligung erteilt haben</li>
              <li>Art. 6 Abs. 1 lit. b DSGVO, wenn die Verarbeitung zur Vertragserfüllung oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist</li>
              <li>Art. 6 Abs. 1 lit. c DSGVO, wenn wir gesetzlich zur Verarbeitung verpflichtet sind</li>
              <li>Art. 6 Abs. 1 lit. f DSGVO, wenn wir ein berechtigtes Interesse an der Verarbeitung haben</li>
            </ul>

            <h2>5. Hosting und Server-Logfiles</h2>
            <p>Unsere Website wird bei folgendem Anbieter gehostet:</p>
            <p>
              Cloudflare, Inc.<br/>
              101 Townsend St, San Francisco, CA 94107, USA
            </p>
            <p>Beim Besuch unserer Website werden automatisch Informationen in sogenannten Server-Logfiles erfasst. Dazu können gehören:</p>
            <ul>
              <li>IP-Adresse</li>
              <li>Datum und Uhrzeit der Anfrage</li>
              <li>aufgerufene Seite oder Datei</li>
              <li>verwendeter Browser</li>
              <li>verwendetes Betriebssystem</li>
              <li>Referrer-URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>übertragene Datenmenge</li>
            </ul>
            <p>Die Verarbeitung dieser Daten erfolgt, um die Website technisch auszuliefern, Stabilität und Sicherheit zu gewährleisten und Missbrauch zu verhindern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im sicheren und zuverlässigen Betrieb unserer Website. Mit dem Hosting-Anbieter wurde ein Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO geschlossen.</p>

            <h2>6. Cookies und Einwilligungsmanagement</h2>
            <p>Unsere Website verwendet Cookies und vergleichbare Technologien. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden.</p>
            <h3>Technisch notwendige Cookies</h3>
            <p>Diese Cookies sind erforderlich, damit die Website funktioniert. Dazu können zum Beispiel Cookies für Sicherheit, Spracheinstellungen, Consent-Verwaltung oder Buchungsfunktionen gehören. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO sowie § 25 Abs. 2 TDDDG.</p>
            <h3>Statistik- und Marketing-Cookies</h3>
            <p>Diese Cookies und Technologien helfen uns, die Nutzung unserer Website zu analysieren, Inhalte zu verbessern und Marketingmaßnahmen auszuwerten. Diese Dienste werden nur nach Ihrer ausdrücklichen Einwilligung aktiviert. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO sowie § 25 Abs. 1 TDDDG. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.</p>

            <h2>7. Kontaktformular / Buchungsanfragen</h2>
            <p>Wenn Sie uns über das Kontaktformular oder per E-Mail kontaktieren, verarbeiten wir die von Ihnen eingegebenen Daten (Name, E-Mail, Telefon, Nachricht). Die Verarbeitung erfolgt zur Bearbeitung Ihrer Anfrage und für mögliche Anschlussfragen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit einer Buchung zusammenhängt. In allen anderen Fällen erfolgt die Verarbeitung auf Grundlage unseres berechtigten Interesses an der Bearbeitung von Anfragen gemäß Art. 6 Abs. 1 lit. f DSGVO.</p>

            <h2>8. Online-Buchung / Zimmerreservierung</h2>
            <p>Auf unserer Website können Sie Zimmer oder Aufenthalte online buchen. Dabei verarbeiten wir je nach Buchungsprozess insbesondere folgende Daten:</p>
            <ul>
              <li>Vorname und Nachname</li>
              <li>Adresse</li>
              <li>E-Mail-Adresse und Telefonnummer</li>
              <li>Anreise- und Abreisedatum, Anzahl der Gäste, Zimmerkategorie</li>
              <li>Zahlungs- und Rechnungsdaten</li>
            </ul>
            <p>Die Datenverarbeitung erfolgt zur Durchführung vorvertraglicher Maßnahmen, zur Bearbeitung Ihrer Buchung sowie zur Erfüllung des Beherbergungsvertrags. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Buchungs- und Rechnungsdaten werden entsprechend den gesetzlichen Aufbewahrungsfristen bis zu 10 Jahre gespeichert (Art. 6 Abs. 1 lit. c DSGVO).</p>

            <h2>9. Zahlungsabwicklung</h2>
            <p>Wenn auf unserer Website oder im Rahmen der Online-Buchung Online-Zahlungen angeboten werden, können Zahlungsdaten an externe Zahlungsdienstleister übermittelt werden. Die konkrete Zahlungsabwicklung erfolgt über:</p>
            <p>
              <strong>Mollie</strong><br/>
              Mollie B.V., Keizersgracht 126, 1015 CW Amsterdam, Niederlande<br/>
              Datenschutzerklärung: <a href="https://www.mollie.com/de/legal/privacy" target="_blank" rel="noopener noreferrer">https://www.mollie.com/de/legal/privacy</a>
            </p>
            <p>Die Verarbeitung erfolgt zur Abwicklung der Zahlung und damit zur Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO.</p>

            <h2>10. Meldeschein / gesetzliche Gästedaten</h2>
            <p>Als Beherbergungsbetrieb sind wir gesetzlich verpflichtet, bestimmte Gästedaten (Name, Adresse, Geburtsdatum, An-/Abreise etc.) zu erheben und aufzubewahren. Die Verarbeitung erfolgt zur Erfüllung gesetzlicher Pflichten (Art. 6 Abs. 1 lit. c DSGVO).</p>

            <h2>11. Google Maps & Social Media</h2>
            <p>Auf unserer Website verwenden wir Google Maps (Google Ireland Limited) zur Darstellung unseres Standorts. Beim Laden von Google Maps können personenbezogene Daten an Google übermittelt werden. Google Maps wird nur geladen, wenn Sie zuvor Ihre Einwilligung erteilt haben (Art. 6 Abs. 1 lit. a DSGVO).</p>
            <p>Wir verlinken auf unsere Social-Media-Profile bei Facebook und Instagram (Meta Platforms Ireland Limited). Eine Datenübertragung erfolgt erst, wenn Sie den Link aktiv anklicken (Art. 6 Abs. 1 lit. f DSGVO).</p>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
