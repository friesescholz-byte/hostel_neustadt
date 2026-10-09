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
            <p>
              Der Schutz Ihrer personenbezogenen Daten ist uns ein wichtiges Anliegen. Nachfolgend informieren wir Sie umfassend darüber, welche personenbezogenen Daten wir beim Besuch unserer Website, bei der Kontaktaufnahme (z. B. via WhatsApp oder E-Mail), bei der Nutzung unseres Online-Buchungssystems sowie bei der Nutzung externer Dienste wie Google Maps, Google Analytics, dem Meta-Pixel und Zahlungsdienstleistern wie Mollie erheben und wie wir diese verarbeiten.
            </p>
            <p>
              Personenbezogene Daten sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen (z. B. Name, Anschrift, E-Mail-Adresse, Telefonnummer, IP-Adresse oder Buchungsdaten).
            </p>

            <h2>2. Verantwortliche Stelle</h2>
            <p>Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
            <p>
              <strong>Eigentümergemeinschaft GbR Ahmed Bagari und Corinna Pasqualini</strong><br/>
              Bertha-Sicius-Str. 6<br/>
              31535 Neustadt am Rübenberge<br/>
              Deutschland
            </p>
            <p>
              <strong>Vertretungsberechtigte Gesellschafter:</strong> Ahmed Bagari und Corinna Pasqualini<br/>
              <strong>Telefon / WhatsApp:</strong> +49 172 8572368<br/>
              <strong>E-Mail:</strong> <a href="mailto:vermietung@bh-am-ruebenberge.de">vermietung@bh-am-ruebenberge.de</a><br/>
              <strong>Website:</strong> <a href="https://hostel-neustadt.de">www.hostel-neustadt.de</a>
            </p>

            <h2>3. Datenschutzbeauftragter</h2>
            <p>
              Die gesetzlichen Voraussetzungen für die verpflichtende Benennung eines Datenschutzbeauftragten nach Art. 37 DSGVO bzw. § 38 BDSG liegen nicht vor. Bei allen datenschutzrechtlichen Anliegen können Sie sich direkt an die oben genannte verantwortliche Stelle wenden.
            </p>

            <h2>4. Rechtsgrundlagen der Datenverarbeitung</h2>
            <p>Wir verarbeiten Ihre personenbezogenen Daten unter Einhaltung der geltenden Datenschutzvorschriften (insbesondere DSGVO und TDDDG). Die Verarbeitung erfolgt auf Basis folgender Rechtsgrundlagen:</p>
            <ul>
              <li><strong>Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG):</strong> Wenn Sie uns für bestimmte Zwecke (z. B. Web-Analyse via Google Analytics, Marketing via Meta-Pixel, interaktive Karten via Google Maps) Ihre ausdrückliche Einwilligung erteilt haben.</li>
              <li><strong>Vertragserfüllung & vorvertragliche Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO):</strong> Zur Bearbeitung von Reservierungsanfragen, Durchführung von Zimmerbuchungen und Zahlungsabwicklungen sowie Kundenbetreuung.</li>
              <li><strong>Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):</strong> Zur Erfüllung gesetzlicher Pflichten (z. B. Meldescheinpflicht nach dem Bundesmeldegesetz, steuer- und handelsrechtliche Aufbewahrungsfristen).</li>
              <li><strong>Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):</strong> Zur Wahrung unserer berechtigten Interessen an einem sicheren, stabilen und wirtschaftlichen Betrieb unserer Website.</li>
            </ul>

            <h2>5. Hosting & Content Delivery Network (Cloudflare)</h2>
            <p>Unsere Website wird über die Dienste des Anbieters <strong>Cloudflare, Inc.</strong> (101 Townsend St, San Francisco, CA 94107, USA) gehostet und ausgeliefert.</p>
            <p>
              Cloudflare fungiert als Content Delivery Network (CDN) und Web-Application-Firewall (WAF) zur Absicherung unserer Website gegen Cyberangriffe (wie z. B. DDoS-Attacken) und zur Beschleunigung der weltweiten Ladezeiten. Dabei wird der Datenverkehr zwischen Ihrem Browser und unseren Servern über das globale Netzwerk von Cloudflare geleitet. Hierbei können Server-Logfiles verarbeitet werden (IP-Adresse, Datum/Uhrzeit der Anfrage, aufgerufene URL, User-Agent-Informationen).
            </p>
            <p>
              Rechtsgrundlage ist unser berechtigtes Interesse an der technischen Stabilität, Sicherheit und Performance unseres Onlineangebots gemäß Art. 6 Abs. 1 lit. f DSGVO. Die Datenübermittlung in die USA wird auf die Standardvertragsklauseln (SCC) der EU-Kommission gestützt; zudem ist Cloudflare unter dem EU-U.S. Data Privacy Framework zertifiziert.
            </p>

            <h2>6. Cookies, LocalStorage & Einwilligungs-Management</h2>
            <p>
              Unsere Website verwendet Cookies sowie Speichertechnologien des Browsers (LocalStorage und SessionStorage). Cookies sind kleine Textdateien, die auf Ihrem Endgerät abgelegt werden.
            </p>
            <h3>Technisch notwendige Speicherungen</h3>
            <p>
              Einige Cookies und Storage-Einträge sind zwingend erforderlich, damit Kernfunktionen der Website einwandfrei funktionieren (z. B. Warenkorb-Funktion und Zimmer-Reservierungs-Hold während des Buchungsprozesses, Speicherung Ihres gewählten Cookie-Einwilligungsstatus). Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG i. V. m. Art. 6 Abs. 1 lit. f DSGVO bzw. Art. 6 Abs. 1 lit. b DSGVO.
            </p>
            <h3>Einwilligungsbedürftige Analyse- und Marketingdienste</h3>
            <p>
              Optionale Dienste zur Analyse des Nutzerverhaltens oder zu Marketingzwecken (Google Analytics, Meta-Pixel, Google Maps) werden ausschließlich dann geladen und ausgeführt, wenn Sie dem zuvor aktiv über unser Cookie-Einwilligungs-Banner zugestimmt haben. Rechtsgrundlage ist § 25 Abs. 1 TDDDG i. V. m. Art. 6 Abs. 1 lit. a DSGVO. Sie können Ihre einmal erteilte Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.
            </p>

            <h2>7. Google Maps</h2>
            <p>
              Auf unserer Website binden wir interaktive Karten des Dienstes <strong>Google Maps</strong> ein. Dienstanbieter für Nutzer im Europäischen Wirtschaftsraum ist <strong>Google Ireland Limited</strong> (Gordon House, Barrow Street, Dublin 4, Irland; Muttergesellschaft: Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA).
            </p>
            <p>
              Durch die Einbindung von Google Maps wird Ihnen die direkte Standortsuche und Anfahrtsplanung zu unserer Unterkunft erleichtert. Beim Laden und der Nutzung der Karte werden Informationen über Ihre Nutzung dieser Website (einschließlich Ihrer IP-Adresse sowie gegebenenfalls Standortdaten) an Server von Google übermittelt und dort gespeichert.
            </p>
            <p>
              Die Nutzung von Google Maps erfolgt ausschließlich auf Grundlage Ihrer vorherigen Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO sowie § 25 Abs. 1 TDDDG. Sie können Ihre Einwilligung jederzeit widerrufen. Weitere Informationen zum Datenschutz bei Google finden Sie unter: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>.
            </p>

            <h2>8. Google Analytics (GA4)</h2>
            <p>
              Diese Website nutzt Funktionen des Webanalysedienstes <strong>Google Analytics 4</strong>, bereitgestellt von <strong>Google Ireland Limited</strong> (Gordon House, Barrow Street, Dublin 4, Irland).
            </p>
            <p>
              Google Analytics verwendet Technologien (wie z. B. Cookies), die eine Analyse der Benutzung der Website durch Sie ermöglichen. Die durch den Dienst erfassten Informationen über Ihre Benutzung dieser Website (z. B. Verweildauer, Klicks, aufgerufene Unterseiten, ungefährer Standort, Gerätetyp) werden in der Regel an einen Server von Google übermittelt und dort gespeichert.
            </p>
            <p>
              Auf dieser Website ist die <strong>IP-Anonymisierung</strong> standardmäßig aktiviert. Ihre IP-Adresse wird von Google innerhalb von Mitgliedstaaten der Europäischen Union oder in anderen Vertragsstaaten des Abkommens über den Europäischen Wirtschaftsraum vor der Speicherung gekürzt, sodass ein direkter Personenbezug ausgeschlossen ist.
            </p>
            <p>
              Rechtsgrundlage für den Einsatz von Google Analytics ist Ihre ausdrückliche Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG. Sie können Ihre Einwilligung jederzeit über das Cookie-Einwilligungs-Banner widerrufen oder die Erfassung durch Google mit dem offiziellen Browser-Add-on unter <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout</a> verhindern.
            </p>

            <h2>9. Meta-Pixel (ehemals Facebook-Pixel) & Remarketing</h2>
            <p>
              Wir setzen auf unserer Website zur Konversionsmessung und Zielgruppenoptimierung das <strong>Meta-Pixel</strong> des Anbieters <strong>Meta Platforms Ireland Limited</strong> (Merrion Road, Dublin 4, D04 X2K5, Irland) ein.
            </p>
            <p>
              Mit Hilfe des Meta-Pixels kann Meta die Besucher unserer Website als Zielgruppe für die Darstellung von Werbeanzeigen (sogenannte „Facebook-Ads“ und „Instagram-Ads“) bestimmen. Dadurch können wir sicherstellen, dass unsere geschalteten Anzeigen dem potenziellen Interesse der Nutzer entsprechen. Des Weiteren können wir nachvollziehen, ob Nutzer nach dem Klick auf eine Anzeige auf unsere Website weitergeleitet wurden (Conversion-Messung).
            </p>
            <p>
              Rechtsgrundlage ist Ihre ausdrückliche Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG. Sie können Ihre Einwilligung jederzeit in den Cookie-Einstellungen widerrufen. Wenn Sie bei Facebook oder Instagram eingeloggt sind, können Sie zudem in Ihren Profileinstellungen unter Werbepräferenzen festlegen, welche Arten von Werbung Ihnen angezeigt werden: <a href="https://www.facebook.com/adpreferences/ad_settings" target="_blank" rel="noopener noreferrer">https://www.facebook.com/adpreferences/ad_settings</a>.
            </p>

            <h2>10. Kontaktaufnahme per WhatsApp & E-Mail</h2>
            <p>
              Wenn Sie uns per E-Mail oder über den bereitgestellten <strong>WhatsApp-Chat</strong> (+49 172 8572368) kontaktieren, werden Ihre Angaben (Name, Telefonnummer, E-Mail-Adresse, Chatnachrichten sowie übermittelte Daten) zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
            </p>
            <p>
              Dienstanbieter für WhatsApp ist <strong>WhatsApp Ireland Limited</strong> (4 Grand Canal Square, Grand Canal Harbour, Dublin 2, Irland). WhatsApp setzt eine Ende-zu-Ende-Verschlüsselung für Kommunikationsinhalte ein, sodass Dritte den Chatverlauf nicht einsehen können. Metadaten (wie Datum, Uhrzeit und beteiligte Telefonnummern) werden jedoch von WhatsApp verarbeitet.
            </p>
            <p>
              Rechtsgrundlage für diese Verarbeitung ist Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Kontaktaufnahme mit der Vorbereitung oder Durchführung einer Buchung zusammenhängt. In allen sonstigen Fällen stützt sich die Verarbeitung auf unser berechtigtes Interesse an einer schnellen und unkomplizierten Kundenkommunikation (Art. 6 Abs. 1 lit. f DSGVO) sowie auf Ihre konkludente Einwilligung durch die aktive Nutzung des WhatsApp-Dienstes (Art. 6 Abs. 1 lit. a DSGVO).
            </p>

            <h2>11. Cloudflare Turnstile (Bot- & Spamschutz für Formulare)</h2>
            <p>
              Wir nutzen auf unserer Website den Dienst <strong>Cloudflare Turnstile</strong> des Anbieters <strong>Cloudflare Inc.</strong> (101 Townsend St, San Francisco, CA 94107, USA; EU-Niederlassung: Cloudflare Germany GmbH, Rosental 7, 80331 München).
            </p>
            <p>
              Turnstile dient der Überprüfung, ob Dateneingaben auf unserer Website (insbesondere im Anfrageformular für Langzeitaufenthalte) durch einen menschlichen Nutzer oder missbräuchlich durch automatisierte Programme (Bots) erfolgen. Hierdurch schützen wir unsere Systeme vor Spam, Überlastung und DoS-Angriffen.
            </p>
            <p>
              Im Rahmen der Sicherheitsprüfung analysiert Turnstile verschiedene technische Merkmale des Endgeräts und Browsers (wie z.&nbsp;B. HTTP-Header, Browser-Konfiguration, Ausführungsverhalten von Skripten). Turnstile verzichtet dabei auf das Setzen von Tracking-Cookies für Werbezwecke und scannt keine privaten Gerätedaten.
            </p>
            <p>
              Die Verarbeitung erfolgt auf Grundlage unseres berechtigten Interesses an der Sicherheit und Funktionsfähigkeit unseres Webangebots sowie der Vermeidung von automatisiertem Spam und Missbrauch gemäß <strong>Art. 6 Abs. 1 lit. f DSGVO</strong>. Soweit Daten in die USA übermittelt werden, stützt sich Cloudflare auf das <strong>EU-U.S. Data Privacy Framework (DPF)</strong> sowie von der EU-Kommission genehmigte Standardvertragsklauseln (SCCs). Weitere Informationen finden Sie in den Datenschutzbestimmungen von Cloudflare unter <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">https://www.cloudflare.com/privacypolicy/</a>.
            </p>

            <h2>12. Online-Buchungssystem & Zimmerreservierung</h2>
            <p>
              Wenn Sie über unsere Website eine Reservierung vornehmen, erfassen wir die für die Buchung und Vertragsabwicklung erforderlichen Angaben:
            </p>
            <ul>
              <li>Vor- und Nachname</li>
              <li>Anschrift (Straße, Hausnummer, PLZ, Ort, Land)</li>
              <li>E-Mail-Adresse und Telefonnummer</li>
              <li>Reisedaten (Anreise, Abreise, gebuchte Zimmerkategorie, Anzahl der Gäste)</li>
              <li>Ggf. Firmenname und individuelle Anmerkungen</li>
            </ul>
            <p>
              Rechtsgrundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Beherbergungsvertrags bzw. Durchführung vorvertraglicher Maßnahmen).
            </p>

            <h2>13. Gesetzliche Gästedaten & Meldeschein</h2>
            <p>
              Gemäß §§ 29 und 30 des Bundesmeldegesetzes (BMG) sind Beherbergungsstätten in Deutschland verpflichtet, von jedem Gast bei Ankunft einen besonderen Meldeschein mit personenbezogenen Daten (u. a. Name, Geburtsdatum, Staatsangehörigkeit, Anschrift) ausfüllen und unterschreiben zu lassen.
            </p>
            <p>
              Die Verarbeitung dieser Daten erfolgt zur Erfüllung einer rechtlichen Verpflichtung gemäß Art. 6 Abs. 1 lit. c DSGVO. Die Meldescheine werden gemäß den gesetzlichen Aufbewahrungsfristen für die Dauer eines Jahres aufbewahrt und anschließend vernichtet. Buchungs- und Rechnungsunterlagen werden gemäß § 147 AO und § 257 HGB für bis zu 10 Jahre archiviert.
            </p>

            <h2>14. Zahlungsabwicklung über Mollie</h2>
            <p>
              Für die sichere Abwicklung von Online-Zahlungen (Kreditkarte, PayPal, Klarna, Giropay, Apple Pay) nutzen wir die Zahlungsplattform des Zahlungsdienstleisters:
            </p>
            <p>
              <strong>Mollie B.V.</strong><br/>
              Keizersgracht 126, 1015 CW Amsterdam, Niederlande<br/>
              Datenschutzerklärung: <a href="https://www.mollie.com/de/legal/privacy" target="_blank" rel="noopener noreferrer">https://www.mollie.com/de/legal/privacy</a>
            </p>
            <p>
              Im Rahmen der Zahlungstransaktion werden Ihre Bestelldaten (z. B. Buchungsnummer, Rechnungsbetrag, Währung) an Mollie übermittelt. Mollie verarbeitet diese Daten zur Durchführung der Zahlung und zur Betrugsprävention als eigenständiger datenschutzrechtlicher Verantwortlicher. Rechtsgrundlage für die Übermittlung ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>

            <h2>15. Social Media Links</h2>
            <p>
              Auf unserer Website finden Sie Verlinkungen zu unseren Profilen in den sozialen Netzwerken <strong>Instagram</strong> und <strong>Facebook</strong> (Meta Platforms Ireland Limited).
            </p>
            <p>
              Hierbei handelt es sich um reguläre Hyperlinks und nicht um sogenannte Social Plugins, die bereits beim Laden der Seite Daten an die Plattformen übermitteln. Eine Verbindung zu den Servern der sozialen Netzwerke wird erst hergestellt, wenn Sie aktiv auf das entsprechende Icon klicken.
            </p>

            <h2>16. SSL- bzw. TLS-Verschlüsselung</h2>
            <p>
              Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum Beispiel Buchungsanfragen oder Zahlungsdaten, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
            </p>

            <h2>17. Rechte der betroffenen Personen</h2>
            <p>Nach der Datenschutz-Grundverordnung stehen Ihnen umfassende Betroffenenrechte zu:</p>
            <ul>
              <li><strong>Recht auf Auskunft (Art. 15 DSGVO):</strong> Sie haben das Recht, jederzeit Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten zu verlangen.</li>
              <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können unverzüglich die Berichtigung unrichtiger oder die Vervollständigung Ihrer bei uns gespeicherten Daten verlangen.</li>
              <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie haben das Recht, die Löschung Ihrer Daten zu verlangen, sofern keine gesetzlichen Aufbewahrungsfristen entgegenstehen.</li>
              <li><strong>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können unter bestimmten Voraussetzungen die Einschränkung der Verarbeitung Ihrer Daten verlangen.</li>
              <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie haben das Recht, Daten, die wir automatisiert verarbeiten, in einem gängigen, maschinenlesbaren Format zu erhalten.</li>
              <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der künftigen Verarbeitung Ihrer Daten widersprechen, sofern die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO erfolgt.</li>
              <li><strong>Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Einmal erteilte Einwilligungen können Sie jederzeit mit Wirkung für die Zukunft widerrufen.</li>
              <li><strong>Beschwerderecht bei der zuständigen Aufsichtsbehörde (Art. 77 DSGVO):</strong> Im Falle von Verstößen gegen das Datenschutzrecht steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu. Zuständige Aufsichtsbehörde ist insbesondere:<br/>
                <em>Die Landesbeauftragte für den Datenschutz Niedersachsen<br/>
                Prinzenstraße 5, 30159 Hannover<br/>
                Website: <a href="https://lfd.niedersachsen.de" target="_blank" rel="noopener noreferrer">https://lfd.niedersachsen.de</a></em>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
