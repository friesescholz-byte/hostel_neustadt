import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LegalPage.css';

const ImprintPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="legal-page">
        <div className="legal-container">
          <h1 className="legal-title">Impressum</h1>
          
          <div className="legal-content">
            <h2>Angaben gemäß § 5 DDG</h2>
            <p>
              <strong>Eigentümergemeinschaft GbR Ahmed Bagari und Corinna Pasqualini</strong><br/>
              Bertha-Sicius-Str. 6<br/>
              31535 Neustadt am Rübenberge<br/>
              Deutschland
            </p>

            <h2>Rechtsform & Vertretung</h2>
            <p>
              <strong>Rechtsform:</strong> Gesellschaft bürgerlichen Rechts (GbR)<br/>
              <strong>Vertretungsberechtigte Gesellschafter:</strong> Ahmed Bagari und Corinna Pasqualini
            </p>

            <h2>Kontakt</h2>
            <p>
              Telefon / WhatsApp: +49 172 8572368<br/>
              E-Mail: <a href="mailto:vermietung@bh-am-ruebenberge.de">vermietung@bh-am-ruebenberge.de</a><br/>
              Website: <a href="https://hostel-neustadt.de">www.hostel-neustadt.de</a>
            </p>

            <h2>Registereintrag</h2>
            <p>
              Eine Eintragung im Handelsregister ist für eine Gesellschaft bürgerlichen Rechts (GbR) gesetzlich nicht vorgesehen und liegt nicht vor.
            </p>

            <h2>Zuständige Aufsichts- & Gewerbebehörde</h2>
            <p>
              Gewerbeanmeldung nach § 14 GewO erteilt durch:<br/>
              Stadt Neustadt am Rübenberge – Fachbereich Bürgerdienste / Gewerbeamt<br/>
              Theodor-Heuss-Straße 18<br/>
              31535 Neustadt am Rübenberge
            </p>

            <h2>Umsatzsteuer-Identifikationsnummer</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br/>
              <strong>DE463070397</strong>
            </p>

            <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit, die Sie unter <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</a> finden. Unsere E-Mail-Adresse finden Sie oben in den Kontaktdaten dieses Impressums.
            </p>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>

            <h2>Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>

            <h2>Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
            <p>
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung unzumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>

            <h2>Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
            <p>
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ImprintPage;
