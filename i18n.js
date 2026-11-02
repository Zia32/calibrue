// Calibrue languages: English (as written in the pages) and German.
// Works on the finished page: every text node, placeholder, title and aria-label is looked up,
// and a MutationObserver translates text the scripts set later. Lookup order for a text:
// exact match, then sentence by sentence (exact or template match). Templates use {} for a
// value; values are themselves looked up (so "top-left" inside a sentence is translated too).
// Anything not in the dictionary stays English. Choice: ?lang=de|en, then the saved choice,
// then the browser language. Put <span data-lang-switch></span> where the switch should go.
(function () {
  const KEY = 'calibrue.lang';
  let lang = 'en';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'de' || q === 'en') localStorage.setItem(KEY, q);
    lang = localStorage.getItem(KEY) || ((navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en');
  } catch (e) { lang = (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en'; }

  const DE = {
    // ---- shared ----
    'Calibrue home': 'Calibrue Startseite', 'Report': 'Bericht', 'Close': 'Schließen', 'Stop': 'Stopp', 'Stopped.': 'Gestoppt.',
    'Red': 'Rot', 'Green': 'Grün', 'Blue': 'Blau', 'Grey': 'Grau', 'Screen': 'Bildschirm', 'Calibration': 'Kalibrierung',
    'Calibrate': 'Kalibrieren', 'Verify': 'Prüfen', 'Profile': 'Profil', 'Full screen': 'Vollbild', 'Fullscreen': 'Vollbild',
    'Win': 'Win', 'colorcpl': 'colorcpl', 'Yes': 'Ja', 'Click': 'Klicken Sie auf', 'Press': 'Drücken Sie', ', type': ', tippen Sie',
    'Devices': 'Geräte', 'Advanced': 'Erweitert', 'Add…': 'Hinzufügen…', 'Browse…': 'Durchsuchen…', 'Add': 'Hinzufügen',
    'Set as Default Profile': 'Als Standardprofil', 'Change system defaults…': 'Systemstandards ändern…',
    'Use my settings for this device': 'Eigene Einstellungen für das Gerät verwenden', 'Use Windows display calibration': 'Windows-Anzeigekalibrierung verwenden',
    '→ Close.': '→ Schließen.', 'tab →': 'Registerkarte →', 'Download one-click installer': 'Ein-Klick-Installer herunterladen',
    'Profile only (.icc)': 'Nur das Profil (.icc)', 'Calibration report': 'Kalibrierungsbericht', 'Calibration report →': 'Kalibrierungsbericht →',
    'built-in screen': 'eingebauter Bildschirm', 'unknown screen': 'unbekannter Bildschirm', 'screen {}': 'Bildschirm {}',
    'Version {}.': 'Version {}.', 'laptop page': 'Laptop-Seite', 'profile page': 'Profilseite', 'Done': 'Fertig', 'Reset': 'Zurücksetzen',
    'excellent': 'sehr gut', 'good': 'gut', 'fair': 'mäßig', 'crushed': 'verschluckt', 'needs attention': 'verbesserungsbedürftig',
    'centre': 'Mitte', 'top-left': 'oben links', 'top-right': 'oben rechts', 'bottom-left': 'unten links', 'bottom-right': 'unten rechts',
    'dark grey': 'Dunkelgrau', 'light grey': 'Hellgrau', '1×1 checker': '1×1-Schachbrett', '2×2 checker': '2×2-Schachbrett',
    'horizontal lines': 'waagerechte Linien', 'vertical lines': 'senkrechte Linien', 'Language': 'Sprache',

    // ---- index ----
    'Open the laptop page on the Windows laptop, then scan its QR code with the iPhone camera to pair.': 'Öffnen Sie die Laptop-Seite auf dem Windows-Laptop und scannen Sie den QR-Code mit der iPhone-Kamera, um beide zu verbinden.',
    'Laptop: patch display': 'Laptop: Messfeld', 'Shows the flickering test patch.': 'Zeigt das flimmernde Testfeld.',
    'iPhone: flicker sensor': 'iPhone: Flimmersensor', 'Reads the patch with the camera.': 'Liest das Testfeld mit der Kamera.',
    'Laptop: Windows profile': 'Laptop: Windows-Profil', 'Turns the measurement into an .icc file.': 'Macht aus der Messung eine .icc-Datei.',
    'Test patterns': 'Testbilder', 'Full-screen patterns to check any screen by eye.': 'Vollbild-Testbilder, um jeden Bildschirm mit dem Auge zu prüfen.',
    'Laptop: calibration report': 'Laptop: Kalibrierungsbericht', 'Before and after, every check, history.': 'Vorher und nachher, alle Prüfungen, Verlauf.',

    // ---- phone ----
    "Rear camera pressed flat on the laptop's centre square, screen facing you.": 'Rückkamera flach auf das mittlere Quadrat des Laptops drücken, Display zu Ihnen.',
    'Laptop link': 'Verbindung zum Laptop', 'Not paired': 'Nicht verbunden', 'Connect': 'Verbinden', 'Laptop shows': 'Laptop zeigt',
    'Code on laptop': 'Code vom Laptop', 'Paired': 'Verbunden', 'Connecting…': 'Verbinde…', 'Looking for the laptop…': 'Suche den Laptop…',
    'Code must be 6 characters': 'Der Code hat 6 Zeichen', 'Link library did not load. Reload the page.': 'Die Verbindungsbibliothek wurde nicht geladen. Laden Sie die Seite neu.',
    "Relay not reachable. Check the phone's internet.": 'Relay nicht erreichbar. Prüfen Sie die Internetverbindung des iPhones.',
    'Laptop stopped answering. Is its page still open?': 'Der Laptop antwortet nicht mehr. Ist seine Seite noch offen?',
    'Laptop not answering. Reload the laptop page and scan the new QR code.': 'Der Laptop antwortet nicht. Laden Sie die Laptop-Seite neu und scannen Sie den neuen QR-Code.',
    'Calibrate this laptop': 'Diesen Laptop kalibrieren',
    'Laptop on the charger and switched on for 20 minutes (screens shift while warming up), room dimmed.': 'Laptop am Ladegerät und seit 20 Minuten eingeschaltet (Bildschirme verändern sich beim Aufwärmen), Raum abgedunkelt.',
    'External monitor?': 'Externer Monitor?',
    'Drag the laptop page onto it and press F for fullscreen there; the profile is made for that screen.': 'Ziehen Sie die Laptop-Seite auf ihn und drücken Sie dort F für Vollbild; das Profil wird für diesen Bildschirm erstellt.',
    'Windows: Settings → Display → Brightness →': 'Windows: Einstellungen → Anzeige → Helligkeit →',
    'Change brightness based on content: Off': 'Helligkeit je nach Inhalt ändern: Aus',
    'If a Calibrue profile is installed:': 'Wenn ein Calibrue-Profil installiert ist:',
    '→ Advanced → Change system defaults →': '→ Erweitert → Systemstandards ändern →',
    'untick Use Windows display calibration': 'Windows-Anzeigekalibrierung verwenden abwählen',
    "Rear camera flat on the laptop's centre square, this screen facing you. Touchscreen laptop: put a thin cloth (microfibre) between the phone and the screen so it doesn't register as touches. Keep still for about 7 minutes.": 'Rückkamera flach auf das mittlere Quadrat des Laptops, dieses Display zu Ihnen. Laptop mit Touchscreen: Legen Sie ein dünnes Tuch (Mikrofaser) zwischen iPhone und Bildschirm, damit es nicht als Berührung zählt. Etwa 7 Minuten ruhig halten.',
    'Signal check': 'Signalprüfung', 'Pattern check': 'Musterprüfung', 'Colour curves (R, G, B together)': 'Farbkurven (R, G, B gleichzeitig)',
    'Stability & grey reference': 'Stabilität & Graureferenz', 'Build profile': 'Profil erstellen',
    'Pair with the laptop above, then tap Calibrate.': 'Verbinden Sie sich oben mit dem Laptop und tippen Sie dann auf Kalibrieren.',
    'Verify an installed profile': 'Installiertes Profil prüfen', 'Screen checks': 'Bildschirmprüfungen',
    'Extra measurements for the report. They work with or without a profile installed and measure the screen as you see it.': 'Zusätzliche Messungen für den Bericht. Sie funktionieren mit oder ohne installiertes Profil und messen den Bildschirm so, wie Sie ihn sehen.',
    'Shadow & highlight detail (1 min)': 'Schatten- & Lichterdetails (1 Min.)', 'Uniformity, 5 spots (3 min)': 'Gleichmäßigkeit, 5 Stellen (3 Min.)',
    'Match white to another screen (2 min)': 'Weiß an anderen Bildschirm angleichen (2 Min.)',
    'The phone is on the new square: continue': 'Das iPhone liegt auf dem neuen Quadrat: weiter',
    'The phone is on the other screen: continue': 'Das iPhone liegt auf dem anderen Bildschirm: weiter',
    'The phone is on the laptop: continue': 'Das iPhone liegt auf dem Laptop: weiter',
    'Advanced tools and diagnostics': 'Erweiterte Werkzeuge und Diagnose',
    'Checking that the camera sees the screen. Keep the phone flat and still.': 'Prüfe, ob die Kamera den Bildschirm sieht. iPhone flach und ruhig halten.',
    'Pattern check {} of {}: {}.': 'Musterprüfung {} von {}: {}.', 'About {} min left.': 'Noch etwa {} Min.',
    'Colour curves: point {} of {}.': 'Farbkurven: Punkt {} von {}.', 'Keep still.': 'Ruhig halten.',
    'Checking the screen stayed stable…': 'Prüfe, ob der Bildschirm stabil geblieben ist…',
    'Grey reference: dark grey.': 'Graureferenz: Dunkelgrau.', 'Grey reference: light grey.': 'Graureferenz: Hellgrau.',
    'Building the profile…': 'Erstelle das Profil…', 'signal {}': 'Signal {}', 'grey {} · {}': 'Grau {} · {}', 'drift {} levels': 'Drift {} Stufen',
    'saved on laptop': 'auf dem Laptop gespeichert', 'laptop did not confirm': 'Laptop hat nicht bestätigt',
    'Done. Install the profile on the laptop, then tap Verify.': 'Fertig. Installieren Sie das Profil auf dem Laptop und tippen Sie dann auf Prüfen.',
    'The laptop did not confirm.': 'Der Laptop hat nicht bestätigt.', 'The laptop did not answer.': 'Der Laptop hat nicht geantwortet.',
    'Measured, but the laptop did not confirm it received the result.': 'Gemessen, aber der Laptop hat den Empfang nicht bestätigt.',
    'Check the laptop page is open and tap Calibrate again.': 'Prüfen Sie, ob die Laptop-Seite offen ist, und tippen Sie erneut auf Kalibrieren.',
    'Done, but the screen changed during the measurement ({} levels).': 'Fertig, aber der Bildschirm hat sich während der Messung verändert ({} Stufen).',
    'The profile uses the average.': 'Das Profil verwendet den Mittelwert.',
    'For best accuracy: charger in, adaptive brightness off, screen on for 20 minutes, then Calibrate again.': 'Für beste Genauigkeit: Ladegerät an, adaptive Helligkeit aus, Bildschirm 20 Minuten an, dann erneut kalibrieren.',
    'Done.': 'Fertig.', 'On the laptop: Download profile and install it (steps are shown there).': 'Auf dem Laptop: Profil herunterladen und installieren (die Schritte stehen dort).',
    'Then tap Verify here.': 'Tippen Sie dann hier auf Prüfen.', 'gamma, now → after the profile': 'Gamma, jetzt → mit Profil',
    'Verifying at 3 grey levels with the {} (about 1 minute).': 'Prüfe bei 3 Graustufen mit dem Muster {} (etwa 1 Minute).',
    'Keep the phone flat and still.': 'iPhone flach und ruhig halten.', 'Verifying: dark grey…': 'Prüfe: Dunkelgrau…', 'Verifying: light grey…': 'Prüfe: Hellgrau…',
    'gamma at dark · mid · light (target 2.20)': 'Gamma bei dunkel · mittel · hell (Ziel 2,20)',
    'On target: largest error ΔL* {} (under 0.5 is invisible).': 'Im Ziel: größte Abweichung ΔL* {} (unter 0,5 unsichtbar).',
    'Your screen is calibrated.': 'Ihr Bildschirm ist kalibriert.', 'The report is on the laptop.': 'Der Bericht ist auf dem Laptop.',
    'Verified: on target.': 'Geprüft: im Ziel.', 'Refined profile ready on the laptop.': 'Verfeinertes Profil auf dem Laptop bereit.',
    'Off by up to ΔL* {}.': 'Abweichung bis zu ΔL* {}.',
    'The laptop made a refined profile that corrects the whole curve: install it there (replace the old one), then tap Verify again.': 'Der Laptop hat ein verfeinertes Profil erstellt, das die ganze Kurve korrigiert: Installieren Sie es dort (ersetzt das alte) und tippen Sie dann erneut auf Prüfen.',
    'Off by up to ΔL* {}, and the laptop did not answer.': 'Abweichung bis zu ΔL* {}, und der Laptop hat nicht geantwortet.',
    'Check its page is open and tap Verify again.': 'Prüfen Sie, ob seine Seite offen ist, und tippen Sie erneut auf Prüfen.',
    'The camera did not start. Allow camera access for this page and try again.': 'Die Kamera ist nicht gestartet. Erlauben Sie dieser Seite den Kamerazugriff und versuchen Sie es erneut.',
    "The camera can't see the screen clearly (signal {}, needs 4).": 'Die Kamera sieht den Bildschirm nicht deutlich (Signal {}, nötig 4).',
    'Press the phone flat on the centre square, clean the camera lens, dim the room, and tap Calibrate again.': 'Drücken Sie das iPhone flach auf das mittlere Quadrat, reinigen Sie die Kameralinse, dunkeln Sie den Raum ab und tippen Sie erneut auf Kalibrieren.',
    'Too few camera frames.': 'Zu wenige Kamerabilder.', 'Keep the camera running and the page open.': 'Lassen Sie die Kamera laufen und die Seite offen.',
    'Keep the page open and try again.': 'Lassen Sie die Seite offen und versuchen Sie es erneut.',
    'Shadows': 'Schatten', '{}: is level {} visible?': '{}: Ist Stufe {} sichtbar?', 'Press the phone flat on the centre square.': 'Drücken Sie das iPhone flach auf das mittlere Quadrat.',
    'Shadows {}, highlights {}.': 'Schatten {}, Lichter {}.', 'Lower is better: 1–3 means the screen shows the finest steps.': 'Niedriger ist besser: 1–3 heißt, der Bildschirm zeigt die feinsten Stufen.',
    'Saved in the laptop report.': 'Im Laptop-Bericht gespeichert.', 'first visible step above black · below white': 'erste sichtbare Stufe über Schwarz · unter Weiß',
    '{} of 5: move the phone onto the square at the {} of the laptop screen, then tap continue.': '{} von 5: Legen Sie das iPhone auf das Quadrat {} auf dem Laptop-Bildschirm und tippen Sie dann auf weiter.',
    '{}: measuring tint…': '{}: messe Farbstich…', '{}: measuring tone…': '{}: messe Tonwert…',
    'Even screen.': 'Gleichmäßiger Bildschirm.', 'Some spots differ from the centre (marked).': 'Einige Stellen weichen von der Mitte ab (markiert).',
    'Tint differences above 3% and gamma differences above 0.05 are usually visible.': 'Farbstiche über 3 % und Gamma-Unterschiede über 0,05 sind meist sichtbar.',
    'White balance could not be locked on this phone, so tint values are rough.': 'Der Weißabgleich ließ sich auf diesem iPhone nicht sperren, die Farbstichwerte sind daher ungenau.',
    'largest tint and gamma difference from the centre': 'größter Farbstich- und Gamma-Unterschied zur Mitte',
    'reference': 'Referenz',
    'On the other screen (the one whose white you like), open calibrue.com/patterns.html, choose Uniform white, and press the phone flat on it.': 'Öffnen Sie auf dem anderen Bildschirm (dem mit dem Weiß, das Ihnen gefällt) calibrue.com/patterns.html, wählen Sie Gleichmäßiges Weiß und drücken Sie das iPhone flach darauf.',
    'Then tap continue.': 'Tippen Sie dann auf weiter.', "Reading the other screen's white…": 'Lese das Weiß des anderen Bildschirms…',
    'Now press the phone on the white square on the laptop.': 'Drücken Sie das iPhone jetzt auf das weiße Quadrat auf dem Laptop.',
    'Reading the laptop white…': 'Lese das Weiß des Laptops…', 'Adjusting the laptop white, step {}…': 'Passe das Weiß des Laptops an, Schritt {}…',
    'The camera is close to clipping; results may be rough.': 'Die Kamera ist nahe an der Übersteuerung; die Ergebnisse können ungenau sein.',
    'The two whites already match within 1.5%.': 'Die beiden Weißtöne stimmen schon auf 1,5 % überein.', 'Nothing to change.': 'Nichts zu ändern.',
    'The laptop made a new profile with the matched white: install it there (it replaces the old one).': 'Der Laptop hat ein neues Profil mit dem angeglichenen Weiß erstellt: Installieren Sie es dort (es ersetzt das alte).',
    'The laptop did not answer.': 'Der Laptop hat nicht geantwortet.', 'It needs a calibration first (tap Calibrate), and its page must be open.': 'Er braucht zuerst eine Kalibrierung (Kalibrieren tippen), und seine Seite muss offen sein.',
    'White light now red {}%, green {}%, blue {}%.': 'Weißes Licht jetzt Rot {} %, Grün {} %, Blau {} %.',
    'White balance could not be locked on this phone, so the match is rough.': 'Der Weißabgleich ließ sich auf diesem iPhone nicht sperren, die Angleichung ist daher ungenau.',
    'If it still looks slightly off by eye, fine-tune with Match the white on the profile page; it adds to this.': 'Wirkt es für das Auge noch leicht anders, stellen Sie es mit „Weiß angleichen“ auf der Profilseite fein nach; das kommt hinzu.',
    'laptop white vs the other screen, before → after': 'Laptop-Weiß gegenüber dem anderen Bildschirm, vorher → nachher',

    // ---- laptop ----
    'The page is zoomed in, so the test patterns are scaled. Press Ctrl + 0 (or pinch out) until this message disappears.': 'Die Seite ist vergrößert, daher sind die Testbilder skaliert. Drücken Sie Strg + 0 (oder zoomen Sie heraus), bis diese Meldung verschwindet.',
    "Press the iPhone's rear camera on the centre square.": 'Drücken Sie die Rückkamera des iPhones auf das mittlere Quadrat.',
    'Pair your iPhone: scan with the Camera app or type': 'iPhone verbinden: mit der Kamera-App scannen oder eingeben',
    'Connecting to pairing service…': 'Verbinde mit dem Kopplungsdienst…', 'Waiting for iPhone': 'Warte auf das iPhone', 'iPhone connected': 'iPhone verbunden',
    'iPhone not responding. Is its page open?': 'Das iPhone antwortet nicht. Ist seine Seite offen?', 'Connecting to the relay… (needs internet)': 'Verbinde mit dem Relay… (braucht Internet)',
    'Test value': 'Testwert', 'Mode': 'Modus', 'Channel': 'Kanal', 'Patch': 'Feld', 'Centre square': 'Mittleres Quadrat',
    'Start flicker': 'Flimmern starten', 'Hide panel': 'Bereich ausblenden', 'Display refresh': 'Bildwiederholrate', 'measuring…': 'messe…',
    'Actual flicker': 'Tatsächliches Flimmern', 'Dropped frames': 'Verlorene Bilder', 'Pixel ratio': 'Pixelverhältnis', 'none yet': 'noch keine',
    'Identify this screen (shows its name) →': 'Diesen Bildschirm erkennen (zeigt seinen Namen) →', 'Show profile download →': 'Profil-Download anzeigen →',
    'Profile details and EDID →': 'Profildetails und EDID →', 'start/pause ·': 'Start/Pause ·', 'panel ·': 'Bereich ·', 'fullscreen': 'Vollbild',
    'Before testing: turn off Night light and adaptive brightness, and remove any custom colour profile (it changes the patch values).': 'Vor dem Test: Nachtmodus und adaptive Helligkeit ausschalten und eigene Farbprofile entfernen (sie verändern die Feldwerte).',
    "Warning: this page flashes. Don't look at it directly if you're sensitive to flashing light.": 'Achtung: Diese Seite flimmert. Schauen Sie nicht direkt hin, wenn Sie empfindlich auf Lichtblitze reagieren.',
    'Profile ready': 'Profil bereit', 'Refined profile ready': 'Verfeinertes Profil bereit', 'Profile ready · {}': 'Profil bereit · {}', 'Refined profile ready · {}': 'Verfeinertes Profil bereit · {}',
    'gamma measured → target': 'Gamma gemessen → Ziel', 'gamma measured with the old profile → target': 'Gamma mit dem alten Profil gemessen → Ziel',
    'Your measurement is saved on this laptop.': 'Ihre Messung ist auf diesem Laptop gespeichert.', 'Download the profile and install it.': 'Laden Sie das Profil herunter und installieren Sie es.',
    'Verification was slightly off, so this profile adds a small correction on top.': 'Die Prüfung lag etwas daneben, daher fügt dieses Profil eine kleine Korrektur hinzu.',
    'Download it, remove the old Calibrue profile in colorcpl, add this one, then Verify again.': 'Laden Sie es herunter, entfernen Sie das alte Calibrue-Profil in colorcpl, fügen Sie dieses hinzu und prüfen Sie erneut.',
    'White matched to your other screen.': 'Weiß an Ihren anderen Bildschirm angeglichen.',
    'Download this profile, remove the old Calibrue profile in colorcpl, add this one.': 'Laden Sie dieses Profil herunter, entfernen Sie das alte Calibrue-Profil in colorcpl und fügen Sie dieses hinzu.',
    'Its white now matches the other screen.': 'Sein Weiß passt jetzt zum anderen Bildschirm.',
    'White looks slightly yellow or blue next to another screen?': 'Wirkt Weiß neben einem anderen Bildschirm leicht gelblich oder bläulich?',
    'Match the white': 'Weiß angleichen', 'first, then download from that page.': 'zuerst, dann von dieser Seite herunterladen.',
    "Optional: add your screen's colours (for Photoshop, Lightroom, browsers)": 'Optional: die Farben Ihres Bildschirms hinzufügen (für Photoshop, Lightroom, Browser)',
    'Paste the four Chromaticity lines from HWiNFO (Monitor → your laptop screen), or the output of the command on the': 'Fügen Sie die vier Chromaticity-Zeilen aus HWiNFO ein (Monitor → Ihr Laptop-Bildschirm) oder die Ausgabe des Befehls auf der',
    '. Without them the profile assumes standard sRGB.': '. Ohne sie nimmt das Profil Standard-sRGB an.', 'Using standard sRGB.': 'Verwende Standard-sRGB.',
    'Install (about 30 seconds)': 'Installieren (etwa 30 Sekunden)', 'Open the downloaded': 'Öffnen Sie die heruntergeladene Datei',
    'If Windows says it protected your PC:': 'Wenn Windows meldet, dass es Ihren PC geschützt hat:', 'More info': 'Weitere Informationen', 'Run anyway': 'Trotzdem ausführen',
    '. (It warns about every downloaded script.)': '. (Das erscheint bei jedem heruntergeladenen Skript.)',
    'when Windows asks for permission. The screen changes when it finishes.': ', wenn Windows um Erlaubnis fragt. Der Bildschirm ändert sich, sobald es fertig ist.',
    'Restart the browser, open this page again and pair. Then tap': 'Starten Sie den Browser neu, öffnen Sie diese Seite wieder und verbinden Sie. Tippen Sie dann auf',
    'on the iPhone.': 'auf dem iPhone.', 'Install by hand instead': 'Stattdessen von Hand installieren', ', Enter.': ', Eingabe.',
    'tab: tick': 'Registerkarte: Häkchen bei', '. Remove any older Calibrue profile.': '. Entfernen Sie ältere Calibrue-Profile.',
    '→ pick': '→ wählen', '→ Add →': '→ Hinzufügen →', '→ tick': '→ Häkchen bei',
    'Downloaded {}. Install it by hand (below).': '{} heruntergeladen. Installieren Sie es von Hand (unten).', 'Downloaded the installer for {}. Open it:': 'Installer für {} heruntergeladen. Öffnen Sie ihn:',
    'These values do not describe a normal screen, so the profile uses standard sRGB.': 'Diese Werte beschreiben keinen normalen Bildschirm, daher verwendet das Profil Standard-sRGB.',
    'Read.': 'Gelesen.', '{}% of sRGB size, {}% of P3.': '{} % der sRGB-Größe, {} % von P3.', 'Used in the profile.': 'Wird im Profil verwendet.',

    // ---- patterns ----
    'Full-screen patterns for checking a screen by eye: black and white detail, banding, gamma, uniformity, sharpness.': 'Vollbild-Testbilder, um einen Bildschirm mit dem Auge zu prüfen: Schwarz- und Weißdetails, Streifenbildung, Gamma, Gleichmäßigkeit, Schärfe.',
    'Open this page on the screen you want to check.': 'Öffnen Sie diese Seite auf dem Bildschirm, den Sie prüfen möchten.',
    'In the viewer:': 'In der Ansicht:', 'or tap the sides to change pattern,': 'oder an den Seiten tippen zum Wechseln,', 'to close.': 'zum Schließen.',
    "Each pattern is drawn at the screen's real pixels.": 'Jedes Testbild wird in den echten Pixeln des Bildschirms gezeichnet.',
    'Black detail': 'Schwarzdetails', 'White detail': 'Weißdetails', 'Grey ramp': 'Graukeil', 'Colour ramps': 'Farbverläufe', 'Gamma 2.2': 'Gamma 2,2',
    'Uniform white': 'Gleichmäßiges Weiß', 'Uniform 50% grey': 'Gleichmäßiges 50-%-Grau', 'Uniform dark grey': 'Gleichmäßiges Dunkelgrau',
    'Black (backlight bleed)': 'Schwarz (Lichthöfe)', 'Sharpness': 'Schärfe', 'Colour bars': 'Farbbalken',
    'Count the squares you can tell apart from the black background.': 'Zählen Sie die Quadrate, die Sie vom schwarzen Hintergrund unterscheiden können.',
    'A good screen shows from 2 or 3; a calibrated one shows them in even steps.': 'Ein guter Bildschirm zeigt sie ab 2 oder 3; ein kalibrierter in gleichmäßigen Stufen.',
    'Squares just below white (235 to 254).': 'Quadrate knapp unter Weiß (235 bis 254).',
    'You should see each one; if the right-hand ones vanish into white, highlights are clipped.': 'Jedes sollte sichtbar sein; verschwinden die rechten im Weiß, werden Lichter abgeschnitten.',
    'Top: smooth ramp, should show no bands or colour tints.': 'Oben: weicher Verlauf, ohne Streifen oder Farbstich.',
    'Bottom: 32 steps, each a little lighter than the last, all neutral grey.': 'Unten: 32 Stufen, jede etwas heller als die vorige, alle neutral grau.',
    'Red, green, blue and grey from black to full.': 'Rot, Grün, Blau und Grau von Schwarz bis voll.',
    'Look for bands, jumps or a ramp that turns another colour.': 'Achten Sie auf Streifen, Sprünge oder einen Verlauf, der die Farbe wechselt.',
    'Step back until you cannot see the lines.': 'Treten Sie zurück, bis Sie die Linien nicht mehr sehen.',
    'The middle square (186) should then match its striped surround; if the 180 or 192 square matches better, gamma is off.': 'Das mittlere Quadrat (186) sollte dann zur gestreiften Umgebung passen; passt 180 oder 192 besser, stimmt das Gamma nicht.',
    'The whole screen should look the same white.': 'Der ganze Bildschirm sollte im selben Weiß erscheinen.',
    'Look for darker corners, a tint at one edge, or blotches.': 'Achten Sie auf dunklere Ecken, einen Farbstich an einem Rand oder Flecken.',
    'Mid grey shows tint and brightness differences across the screen more clearly than white.': 'Mittelgrau zeigt Farbstich- und Helligkeitsunterschiede deutlicher als Weiß.',
    'Dark grey (25% light).': 'Dunkelgrau (25 % Licht).', 'Look for clouding, a bright edge or a tint in one area.': 'Achten Sie auf Wolken, einen hellen Rand oder einen Farbstich in einem Bereich.',
    'In a dark room, look for light leaking at the edges or corners.': 'Achten Sie im dunklen Raum auf Licht, das an Rändern oder Ecken austritt.',
    'Some glow is normal on IPS screens.': 'Etwas Schimmer ist bei IPS-Bildschirmen normal.',
    'Solid red: check for dead or stuck pixels and an even colour.': 'Reines Rot: auf tote oder hängende Pixel und gleichmäßige Farbe prüfen.',
    'Solid green: check for dead or stuck pixels and an even colour.': 'Reines Grün: auf tote oder hängende Pixel und gleichmäßige Farbe prüfen.',
    'Solid blue: check for dead or stuck pixels and an even colour.': 'Reines Blau: auf tote oder hängende Pixel und gleichmäßige Farbe prüfen.',
    'One-pixel lines and a fine checkerboard.': 'Ein-Pixel-Linien und ein feines Schachbrett.',
    'They should look crisp and even, with no shimmer or colour fringes.': 'Sie sollten scharf und gleichmäßig wirken, ohne Flimmern oder Farbsäume.',
    'Blurry means Windows scaling or a non-native resolution.': 'Unscharf heißt: Windows-Skalierung oder keine native Auflösung.',
    'Fully saturated and 75% colours.': 'Voll gesättigte und 75-%-Farben.', 'Colours should look clean, with no colour bleeding into its neighbour.': 'Die Farben sollten sauber sein und nicht in die Nachbarfarbe auslaufen.',
    'Previous pattern': 'Vorheriges Testbild', 'Next pattern': 'Nächstes Testbild', '{}/{} · {}': '{}/{} · {}',
    '1px columns': '1-px-Spalten', '1px rows': '1-px-Zeilen', '1px checks': '1-px-Schachbrett', '2px checks': '2-px-Schachbrett',

    // ---- report ----
    'Print or save as PDF': 'Drucken oder als PDF speichern', 'No calibration on this laptop yet. Open the': 'Noch keine Kalibrierung auf diesem Laptop. Öffnen Sie die',
    ', pair the iPhone and tap': ', verbinden Sie das iPhone und tippen Sie auf', 'Display health': 'Bildschirmzustand', 'out of 100': 'von 100',
    'out of 100 · {}': 'von 100 · {}', 'Add monthly reminder to calendar': 'Monatliche Erinnerung zum Kalender hinzufügen', 'Result': 'Ergebnis',
    'gamma before (grey)': 'Gamma vorher (Grau)', 'target': 'Ziel', 'gamma after, dark · mid · light': 'Gamma nachher, dunkel · mittel · hell',
    'largest remaining error, ΔL*': 'größte verbleibende Abweichung, ΔL*', 'Not verified yet': 'Noch nicht geprüft', 'Verified on target': 'Geprüft: im Ziel', 'Off target': 'Nicht im Ziel',
    'Tone response': 'Tonwertverlauf', 'Red before': 'Rot vorher', 'Green before': 'Grün vorher', 'Blue before': 'Blau vorher', 'Target 2.20': 'Ziel 2,20',
    'After (latest verification)': 'Nachher (letzte Prüfung)', 'Measurement checks': 'Messprüfungen', 'Check': 'Prüfung', 'Meaning': 'Bedeutung',
    'Verification history': 'Prüfverlauf', 'When': 'Wann', 'Dark': 'Dunkel', 'Mid': 'Mittel', 'Light': 'Hell', 'Largest ΔL*': 'Größte ΔL*',
    'What this report covers': 'Was dieser Bericht abdeckt', 'on target': 'im Ziel', 'off target': 'nicht im Ziel', 'No verifications yet.': 'Noch keine Prüfungen.',
    'Effective gamma across the brightness range. A flat line at 2.20 is a perfectly calibrated screen. Points below the line are too bright there, above it too dark.': 'Effektives Gamma über den Helligkeitsbereich. Eine flache Linie bei 2,20 ist ein perfekt kalibrierter Bildschirm. Punkte unter der Linie sind dort zu hell, darüber zu dunkel.',
    "Calibrue measures the screen's tone response (gamma) and grey balance with the iPhone camera by comparison, which needs no absolute colour sensor. It does not measure brightness in nits, contrast, or colour gamut; gamut figures come from the screen's factory data (EDID). The white point is set by eye with Match the white.": 'Calibrue misst Tonwertverlauf (Gamma) und Graubalance des Bildschirms mit der iPhone-Kamera durch Vergleich und braucht daher keinen absoluten Farbsensor. Helligkeit in Nits, Kontrast und Farbraum werden nicht gemessen; Farbraumwerte stammen aus den Werksdaten des Bildschirms (EDID). Der Weißpunkt wird mit „Weiß angleichen“ eingestellt.',
    'Tone accuracy': 'Tonwertgenauigkeit', 'Grey balance': 'Graubalance', 'Shadow & highlight': 'Schatten & Lichter', 'Uniformity': 'Gleichmäßigkeit', 'Up to date': 'Aktualität',
    'not measured': 'nicht gemessen', 'today': 'heute', '{} days': '{} Tage', 'corrected': 'korrigiert', '{} levels': '{} Stufen', 'ΔL* {}, not verified': 'ΔL* {}, nicht geprüft',
    'Tone accuracy counts most. Uniformity and shadow detail are properties of the panel; calibration does not change them.': 'Die Tonwertgenauigkeit zählt am meisten. Gleichmäßigkeit und Schattendetails sind Eigenschaften des Panels; Kalibrierung ändert sie nicht.',
    'Opens in your calendar app; first reminder {}, then monthly.': 'Öffnet sich in Ihrer Kalender-App; erste Erinnerung am {}, dann monatlich.',
    'Signal': 'Signal', 'Pattern agreement': 'Musterübereinstimmung', 'Stability': 'Stabilität', 'Colour curves': 'Farbkurven', 'Grey reference': 'Graureferenz',
    'White point': 'Weißpunkt', 'Display colours': 'Bildschirmfarben', 'Duration': 'Dauer', 'unchanged': 'unverändert', "The screen's own white.": 'Das eigene Weiß des Bildschirms.',
    'Set by eye with Match the white.': 'Mit dem Auge eingestellt (Weiß angleichen).', 'Matched to another screen with the iPhone camera.': 'Mit der iPhone-Kamera an einen anderen Bildschirm angeglichen.',
    'Shadow detail': 'Schattendetails', 'Highlight detail': 'Lichterdetails', 'Measured {}.': 'Gemessen {}.',
    'Screens drift over months. Verify again monthly; if it goes off target, Calibrate again.': 'Bildschirme verändern sich über Monate. Prüfen Sie monatlich; liegt das Ergebnis nicht mehr im Ziel, kalibrieren Sie erneut.',
    'Install the profile, then tap Verify on the iPhone to fill in the result.': 'Installieren Sie das Profil und tippen Sie dann auf dem iPhone auf Prüfen, um das Ergebnis einzutragen.',
    'Errors under ΔL* 0.5 are invisible.': 'Abweichungen unter ΔL* 0,5 sind unsichtbar.', 'Install the refined profile and verify again.': 'Installieren Sie das verfeinerte Profil und prüfen Sie erneut.',

    // ---- profile ----
    'Turns the iPhone measurement into an .icc profile for this laptop.': 'Macht aus der iPhone-Messung ein .icc-Profil für diesen Laptop.',
    'Back to the laptop page': 'Zurück zur Laptop-Seite', 'Measurement': 'Messung', 'No measurement on this laptop yet. Open the': 'Noch keine Messung auf diesem Laptop. Öffnen Sie die',
    'Measured': 'Gemessen', 'Target': 'Ziel', 'gamma 2.2, white point unchanged': 'Gamma 2,2, Weißpunkt unverändert', 'Input': 'Eingang',
    'All calibrations': 'Alle Kalibrierungen', 'Every calibration and refinement is kept here, per screen.': 'Jede Kalibrierung und Verfeinerung bleibt hier erhalten, pro Bildschirm.',
    'Use': 'Verwenden', 'makes it the current one: download or install it again to switch back.': 'macht sie zur aktuellen: Laden Sie sie erneut herunter oder installieren Sie sie, um zurückzuwechseln.',
    'Before': 'Vorher', 'Verified': 'Geprüft', 'Delete': 'Löschen', 'Delete?': 'Löschen?', 'current': 'aktuell',
    'Display colours (optional)': 'Bildschirmfarben (optional)', 'Copy command': 'Befehl kopieren', 'Copied.': 'Kopiert.',
    'Using standard sRGB until you paste values.': 'Verwende Standard-sRGB, bis Sie Werte einfügen.',
    'Match the white (optional)': 'Weiß angleichen (optional)',
    "Calibration fixes greys and midtones but keeps the screen's own white. If it looks slightly yellow or blue next to another screen you trust, match it here by eye.": 'Die Kalibrierung korrigiert Grautöne und Mitteltöne, behält aber das eigene Weiß des Bildschirms. Wirkt es neben einem vertrauenswürdigen Bildschirm leicht gelblich oder bläulich, gleichen Sie es hier mit dem Auge an.',
    'Open a plain white page on the other screen (for example a blank browser tab) and put it beside this laptop.': 'Öffnen Sie auf dem anderen Bildschirm eine weiße Seite (zum Beispiel einen leeren Browser-Tab) und stellen Sie ihn neben diesen Laptop.',
    'Set the laptop brightness to 100%. A dimmer white looks greyish next to a brighter one even when its colour is right.': 'Stellen Sie die Laptop-Helligkeit auf 100 %. Ein dunkleres Weiß wirkt neben einem helleren gräulich, auch wenn die Farbe stimmt.',
    "Move the sliders until the white below matches the other screen's white. Use": 'Verschieben Sie die Regler, bis das Weiß unten zum Weiß des anderen Bildschirms passt. Nutzen Sie',
    'for an easier comparison.': 'für einen leichteren Vergleich.', 'Warmer': 'Wärmer', 'Cooler': 'Kühler', 'Greener': 'Grüner', 'Magenta': 'Magenta',
    "Unchanged: the screen's own white.": 'Unverändert: das eigene Weiß des Bildschirms.', 'Included in the profile.': 'Im Profil enthalten.',
    'Preview': 'Vorschau', 'The right side shows exactly what the profile will send to the screen. Compare the dark and middle greys.': 'Die rechte Seite zeigt genau, was das Profil an den Bildschirm sendet. Vergleichen Sie die dunklen und mittleren Grautöne.',
    'Now': 'Jetzt', 'After calibration': 'Nach der Kalibrierung', 'Download the profile': 'Profil herunterladen',
    'The installer is a small Windows script: double-click it, allow it, and it installs the profile and switches on Windows display calibration. If Windows says it protected your PC, choose More info → Run anyway.': 'Der Installer ist ein kleines Windows-Skript: Doppelklicken, erlauben, und es installiert das Profil und schaltet die Windows-Anzeigekalibrierung ein. Meldet Windows, dass es Ihren PC geschützt hat, wählen Sie Weitere Informationen → Trotzdem ausführen.',
    'Install it in Windows (about 1 minute)': 'In Windows installieren (etwa 1 Minute)', 'and press Enter. Colour Management opens.': 'und drücken Sie die Eingabetaste. Die Farbverwaltung öffnet sich.',
    'tab: check the Device is your laptop screen, then tick': 'Registerkarte: Prüfen Sie, dass als Gerät Ihr Laptop-Bildschirm gewählt ist, dann Häkchen bei',
    ', then': ', dann', ', pick the downloaded': ', wählen Sie die heruntergeladene', 'file and click': 'Datei und klicken Sie auf',
    'Select it in the list and click': 'Wählen Sie es in der Liste aus und klicken Sie auf', 'tab → tick': 'Registerkarte → Häkchen bei',
    'The screen changes at once: mid greys get slightly brighter.': 'Der Bildschirm ändert sich sofort: mittlere Grautöne werden etwas heller.',
    'Check that it worked': 'Prüfen, ob es funktioniert hat', 'Keep the profile on. Plug in the charger.': 'Profil eingeschaltet lassen. Ladegerät anschließen.',
    'Open the': 'Öffnen Sie die', 'and pair the iPhone again.': 'und verbinden Sie das iPhone erneut.',
    ', pair the iPhone, and tap': ', verbinden Sie das iPhone und tippen Sie auf', 'on the phone. The result is saved here automatically.': 'auf dem iPhone. Das Ergebnis wird hier automatisch gespeichert.',
    'The table shows what the correction does: each input level is sent to the screen as the output level, so that the screen lands on gamma 2.2.': 'Die Tabelle zeigt, was die Korrektur tut: Jede Eingangsstufe wird als Ausgangsstufe an den Bildschirm gesendet, sodass er bei Gamma 2,2 landet.',
    "Colour-managed apps (Photoshop, Lightroom, Chrome, Edge) need to know your screen's red, green, blue and white. Without this step the profile assumes standard sRGB. To read your screen's factory values, open": 'Farbverwaltete Apps (Photoshop, Lightroom, Chrome, Edge) müssen Rot, Grün, Blau und Weiß Ihres Bildschirms kennen. Ohne diesen Schritt nimmt das Profil Standard-sRGB an. Um die Werkswerte Ihres Bildschirms zu lesen, öffnen Sie',
    '(Start → type PowerShell), paste this command and press Enter:': '(Start → PowerShell eingeben), fügen Sie diesen Befehl ein und drücken Sie die Eingabetaste:',
    'Paste the four lines it prints here. If you have': 'Fügen Sie die vier ausgegebenen Zeilen hier ein. Wenn Sie', ', its four': 'haben, sind dessen vier',
    'lines (Monitor → your laptop screen) are more precise; paste those instead.': 'Zeilen (Monitor → Ihr Laptop-Bildschirm) genauer; fügen Sie stattdessen diese ein.',
    'If nothing changes: turn off': 'Wenn sich nichts ändert: Schalten Sie',
    'and HDR in Settings → System → Display, then repeat step 5. To undo, remove the profile in the same Devices tab, or untick Use Windows display calibration.': 'und HDR unter Einstellungen → System → Anzeige aus und wiederholen Sie Schritt 5. Zum Rückgängigmachen entfernen Sie das Profil auf derselben Registerkarte Geräte oder wählen Windows-Anzeigekalibrierung verwenden ab.',
    'Automatically manage colour for apps': 'Farben für Apps automatisch verwalten',
    'On the phone, tap': 'Tippen Sie auf dem iPhone auf', 'Verify an installed profile': 'Installiertes Profil prüfen',
    'It measures dark, mid and light grey; on target means the profile works.': 'Es misst dunkles, mittleres und helles Grau; „im Ziel“ heißt, das Profil funktioniert.', 'The result goes into the': 'Das Ergebnis kommt in den',
    'report': 'Bericht', 'Copies frame rate, camera controls and the current readings as text.': 'Kopiert Bildrate, Kameraeinstellungen und die aktuellen Messwerte als Text.',
    'Results': 'Ergebnisse', 'Copy results': 'Ergebnisse kopieren',
    'Warmer or cooler': 'Wärmer oder kühler', 'Greener or more magenta': 'Grüner oder mehr Magenta',
    'Test image as the screen shows it now': 'Testbild, wie der Bildschirm es jetzt zeigt', 'Test image with the correction applied': 'Testbild mit angewendeter Korrektur',
  };

  // Templates: "{}" → capture. Built once.
  const esc = s => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  const TEMPL = Object.keys(DE).filter(k => k.includes('{}')).map(k => [new RegExp('^' + esc(k).replace(/\\?\{\\?\}/g, '{}').split('{}').join('((?:(?![.?!…]\\s).)+?)') + '$'), DE[k]]);

  function one(s) {
    if (Object.prototype.hasOwnProperty.call(DE, s) && !s.includes('{}')) return DE[s];
    for (const [re, out] of TEMPL) {
      const m = s.match(re);
      if (m) { let i = 1; return out.replace(/\{\}/g, () => { const v = m[i++]; return (v in DE && !v.includes('{}')) ? DE[v] : v; }); }
    }
    return null;
  }
  // Whole text, else sentence by sentence (a sentence ends with . ? ! or … followed by a space).
  function tr(text) {
    const s = text.replace(/\s+/g, ' ').trim();
    if (!s) return null;
    const whole = one(s); if (whole != null) return whole;
    const parts = s.split(/(?<=[.?!…])\s+/); // a dot inside "2.20" has no space after it, so it stays
    if (!parts || parts.length < 2) return null;
    let any = false;
    const out = parts.map(p => { const t = one(p.trim()); if (t != null) { any = true; return t; } return p.trim(); });
    return any ? out.join(' ') : null;
  }
  const done = new WeakMap(); // node → the German we set, so our own change is not translated again
  function node(n) {
    if (n.nodeType === 3) {
      const p = n.parentElement; if (!p || p.closest('script,style,code,kbd,textarea,pre,[data-no-i18n]')) return;
      if (done.get(n) === n.nodeValue) return;
      const t = tr(n.nodeValue); if (t == null) return;
      const lead = n.nodeValue.match(/^\s*/)[0], trail = n.nodeValue.match(/\s*$/)[0];
      const v = lead + t + trail; done.set(n, v); n.nodeValue = v;
    } else if (n.nodeType === 1) {
      if (n.matches('script,style,code,kbd,textarea,pre,[data-no-i18n]')) return;
      for (const a of ['placeholder', 'aria-label', 'title']) { const v = n.getAttribute(a); if (v) { const t = tr(v); if (t != null) n.setAttribute(a, t); } }
      for (const c of n.childNodes) node(c);
    }
  }
  function sw() {
    document.querySelectorAll('[data-lang-switch]').forEach(el => {
      if (el.dataset.built) return; el.dataset.built = '1'; el.setAttribute('data-no-i18n', '');
      el.innerHTML = ['en', 'de'].map(l => l === lang ? `<b>${l.toUpperCase()}</b>` : `<a href="#" data-l="${l}">${l.toUpperCase()}</a>`).join(' · ');
      el.addEventListener('click', e => { const l = e.target.dataset && e.target.dataset.l; if (!l) return; e.preventDefault(); try { localStorage.setItem(KEY, l); } catch (x) {} location.reload(); });
    });
  }
  function start() {
    sw();
    if (lang !== 'de') return;
    document.documentElement.lang = 'de';
    node(document.body);
    new MutationObserver(ms => { for (const m of ms) {
      if (m.type === 'characterData') node(m.target);
      else if (m.type === 'attributes') node(m.target);
      else m.addedNodes.forEach(node);
    } }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title'] });
  }
  window.I18N = { lang, tr: s => (lang === 'de' ? tr(s) || s : s) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
