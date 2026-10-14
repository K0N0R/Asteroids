# Prototyp 0.9 — sześć kadłubów, chwytaki i kamuflaż

## Lot i role statków

Skręt jest słabszy niż w v0.8, a reakcja na zmianę kierunku jest łagodniejsza. Każdy kadłub ma własną prędkość obrotu. Dysze manewrowe zwiększają ją i szybkość reakcji o 20% na poziom; obowiązują zwykłe limity warsztatu. Premia pilota mnoży ten wynik. Bazowa reakcja obrotu spadła z 16 do 6, a reakcja kamery z 18 do 3,5. Kamera nadal śledzi krótszą drogę obrotu i po zakończeniu skrętu ustawia nos statku do góry; podczas skrętu odchylenie jest większe i łagodniejsze.

| Kadłub | HP | Ładownia | Prędkość | Skręt rad/s | Boost | Działka / lasery / chwytaki | Kamuflaż |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Prospector I | 65 | 40 | 300 | 1,15 | ×1,45 | 1 / 1 krótki / 1 krótki | Brak |
| Swift | 60 | 24 | 620 | 2,35 | ×1,60 | 1 / 1 krótki / 1 krótki | Dobry: −60% wykrywania |
| Mule | 150 | 110 | 260 | 0,90 | ×1,25 | 1 / 2 średnie / 3 długie | Brak |
| Bastion | 100 | 30 | 480 | 1,65 | ×1,65 | 2 / 1 krótki / 1 średni | Słaby: −20% |
| Manta | 230 | 60 | 280 | 1,40 | ×1,25 | 1 / 1 średni / 2 średnie | Słaby: −25% |
| Sokół | 125 | 60 | 560 | 1,05 | ×2,10 | 2 / 1 średni / 2 krótkie | Średni: −40% |

To roboczy balans przed premiami pilota i modułów. Chwytaki mają zasięgi 140/220/300, lasery 180/320. Każdy laser zadaje 150 obrażeń skałom na sekundę przed premiami; oba lasery Mule działają osobno z bocznych emiterów. Działka zachowują 18 obrażeń kadłubom i 2 skałom. Strzelają kolejno z właściwych luf, a celowanie pozostaje niezależne od lotu. Wzmocnienia wydobycia nie zwiększają obrażeń bojowych.

Sylwetki i kolory pochodzą z konceptów użytkownika i są rysowane w Pixi. Prospector ma owalny kadłub i centralne działko; Swift zaostrzony dziób i skrzydła; Mule klepsydrę, boczne zbiorniki, dwa silniki i tylne działko. Bastion zachowuje dawną sylwetkę bojową z dwoma bocznymi działkami. Manta przypomina płaszczkę z dwoma silnikami na przednich skrzydłach, a Sokół ma okrągły korpus i rozwidlony dziób. Kolory: kadłub `#4c545b`, wizjer `#22dd7b`, działka `#ffffff`/`#c3c3c3`, ładownia `#ca9229`, silniki `#33373a`/`#465aca`, wzmocnienia `#737373`, laser `#2ddecb`. Chwytaki mają widoczne ramiona i szczęki, a złapany kryształ jest rysowany przy końcu ramienia.

## Chwytaki

Zastąpiły automatyczny magnes oraz przyciąganie laserem. Uruchamiają się automatycznie po wejściu w zasięg, wybierając najbliższe niezarezerwowane kryształy z odsłoniętą drogą. Każde ramię realizuje osobny cykl: wysunięcie → złapanie jednej jednostki → powrót → przekazanie do ładowni. Ładunek nie jest przyznawany przy złapaniu. Kryształy w przestrzeni nie poruszają się przed kontaktem szczęk.

Liczba pracujących ramion nie przekracza wolnych miejsc w ładowni. Ramiona nie zbierają tego samego kryształu podwójnie; również stos materiałów jest obsługiwany po jednej jednostce. Łup z dronów i wraków powstaje jako osobne kryształy. Zbyt duże oddalenie lub przeszkoda podczas wysuwania anuluje próbę. Powracające ramię ma ograniczoną długość, a trzymany minerał podąża za jego końcem. Dokowanie czeka na przekazanie niesionego łupu. Śmierć i odświeżenie nie przyznają materiałów pozostających w szczękach. Pauza zatrzymuje wszystkie cykle.

To animowany mechanizm o kontrolowanej długości, bez osobnych ciał Rapiera dla ramion. Skały i wrogowie zasłaniają drogę do pobrania. Ramię z surowcem nie ma jeszcze systemu obrażeń ani możliwości zerwania.

## Kamuflaż

C przełącza tryb na Swifcie, Bastionie, Mancie i Sokole. Prospector oraz Mule pokazują komunikat o braku obsługi. Aktywny tryb zmniejsza zasięg wykrywania i utrzymania widoczności przez AI według kadłuba. Nie zapewnia niewrażliwości ani natychmiastowego zakończenia pościgu: dron nadal może wykryć bliski statek lub śledzić ostatnią widzianą pozycję przez dotychczasowy czas.

Strzelanie, laser, boost do przodu i otrzymanie obrażeń ujawniają statek na 3 s. Po spokojnym locie kamuflaż wraca automatycznie, jeżeli tryb pozostał włączony. HUD pokazuje kamuflaż albo czas ujawnienia, a kadłub jest półprzezroczysty podczas ukrycia. Na tym etapie nie ma kosztu energii, kamuflażu stacji ani infiltracji.

## Hangar i zapis

Hangar mieści sześć statków. Widok floty i stoczni ma osobne zakładki oraz strony po trzy pozycje. Galeria pokazuje wszystkie sylwetki i klasy kamuflażu. Moduły są nadal przypisane do konkretnych statków. Nowe specjalistyczne kadłuby wymagają warsztatu I; zakup nie usuwa wcześniejszego statku. Złomowanie uwzględnia także koszt dysz manewrowych.

Format zapisu 7 zachowuje ten sam klucz localStorage. Zapisy 1–6 są migrowane: dotychczasowy Prospector zostaje Bastionem, z zachowaniem tożsamości i wyposażenia; dotyczy to aktywnego statku, rezerwy i odzyskiwalnych wraków. Swift i Mule zachowują identyfikatory, ale korzystają z nowych parametrów. Dysze manewrowe zaczynają na poziomie 0. Nowa kampania dostaje słabszego Prospectora I. Pilotów, bazę, surowce, kontrakty, załogę i sygnały ratunkowe zachowujemy. Znacznik aktywnej wyprawy nadal oznacza stratę po odświeżeniu.

## Weryfikacja

Przeszły 92 testy, kontrola typów, lint i build. Nowe testy obejmują sześć układów wyposażenia, relacje parametrów, pełny hangar i zapis, rzeczywisty wpływ dysz na obrót, migrację dawnych kadłubów, sekwencję chwytaka, rezerwację surowców i pojemności, osłonę przeszkód, anulowanie poza zasięgiem, stratę niesionego materiału i rzeczywiste wykrywanie przez AI przy kamuflażu oraz ujawnieniu. Istniejące testy zaktualizowano do nowych parametrów, formatu zapisu i limitu hangaru.

Na osobnym zapisie przeglądarkowym pod portem 3001 sprawdzono galerię, zakup i zapis modułu manewrowego, wybór Mule, wydobycie i zaciąganie pojedynczych kryształów. Swift przełączał kamuflaż pod C, a strzał zmieniał HUD na ujawnienie przez 3 s. Konsola testowej karty nie zgłosiła błędów ani ostrzeżeń. Testy nie korzystały z kampanii użytkownika na porcie 3000.

Podglądy: [galeria statków](screenshots/hulls-v0.9.jpg), [chwytaki](screenshots/grippers-v0.9.jpg), [kamuflaż](screenshots/cloak-v0.9.jpg).
